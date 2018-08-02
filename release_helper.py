import subprocess
import argparse
import requests
import json
import re
import os
import xml.etree.ElementTree as ElementTree
from collections import OrderedDict
from enum import Enum

class SemanticVersion(Enum):
	major=0
	minor=1
	patch=2

class RoboOp(object):
	"""RoboOp is an automated DevOp to handle releases. It has a number of 'abilities' whcih can be called (from the command line), internally they are 'do_' methods."""
	reverse_chron_app_tags = [tag.get('name') for tag in json.loads(requests.get('https://api.github.com/repos/ucam-cl-dtg/isaac-app/tags').content)]
	reverse_chron_api_tags = [tag.get('name') for tag in json.loads(requests.get('https://api.github.com/repos/ucam-cl-dtg/isaac-api/tags').content)]
	tag_regex = re.compile(r'^v(?P<{}>\d+)\.(?P<{}>\d+)\.(?P<{}>\d+)$'.format(SemanticVersion.major.name, SemanticVersion.minor.name, SemanticVersion.patch.name))
	ability_indicator_prefix = 'do_'
	default_task_order = [
		'release_test',
		'regression_test',
		'create_release_tags',
		'take_backup',
		'build_app',
		'bring_old_staging_down',
		'bring_new_staging_up',
		'bring_test_down',
		'bring_down_old_etl',
		'bring_up_new_etl',
		'bring_up_live',
		'stop_old_app',
		'reload_router',
		'monitor_new_services',
		'set_reminder_to_bring_down_old_site',
		'write_changelog',
	]

	@classmethod
	def get_abilities(cls):
		return [attribute[len(cls.ability_indicator_prefix):] for attribute in dir(cls) if attribute.startswith(cls.ability_indicator_prefix)]

	@classmethod
	def next_version(cls, initial_version, type_of_release):
		match = cls.tag_regex.match(initial_version)
		next_version_description = []
		version_bumped = False
		for version_type in list(SemanticVersion):
			if type_of_release is version_type:
				next_version_description.append(str(int(match.group(version_type.name)) + 1))
				version_bumped = True
			elif version_bumped: # if version bumped the remaining versions sections will be 0
				next_version_description.append('0')
			else:
				next_version_description.append(match.group(version_type.name))

		return 'v' + '.'.join(next_version_description)

	def __init__(self, interface):
		# TODO MT a possible improvement would be to run the script on isaac-3 and then pull app and api from the internet into a temporary directory to work with a clean copy
		# TODO MT if this was being run on isaac-3 a more correct way of getting the current releases would be to use docker ps
		self.current_app_tag = RoboOp.reverse_chron_app_tags[0]
		self.current_api_tag = RoboOp.reverse_chron_api_tags[0]

		self.interface = interface
		settings_schema = self.generate_settings_schema()

		self.interface.report_useful_info(self.get_project_info())
		
		settings = self.interface.get_required_settings(settings_schema)
		self.__dict__.update(settings) # make settings "dot accessible" on self

		self.app_only_release = self.target_api_version == self.current_api_tag
		if self.app_only_release:
			self.interface.notify('This will be an app only release')

	def __getattr__(self, name):
		# if I don't have the attribute you're asking for check if it is an ability of mine
		if name in RoboOp.get_abilities():
			return getattr(self, RoboOp.ability_indicator_prefix + name)

	def generate_settings_schema(self):
		release_types = ['app-only', 'full']
		return OrderedDict(
			actions= {
				'nargs': '+',
				'choices': RoboOp.get_abilities(),
				'default': RoboOp.default_task_order,
				'help': 'list of actions to perform',
			},
			target_app_version= {
				'nargs': '?',
				'help': 'target app version tag',
				'regex': RoboOp.tag_regex,
				'prompt': 'What is the target app version (format: vX.X.X, latest app tag: {})'.format(self.current_app_tag)
			},
			target_api_version= {
				'nargs': '?',
				'help': 'target api tag version',
				'regex': RoboOp.tag_regex,
				'prompt': 'What is the target api version (format: vX.X.X, latest api tag: {})'.format(self.current_api_tag)
			}
		)

	def get_project_info(self):
		return {
			'Latest isaac app tag:': self.current_app_tag,
			'Latest isaac api tag:': self.current_api_tag
		}

	def do_release_test(self):
		self.interface.user_instruction(
			'Deploy test for master on isaac-3 using the commands:\n\n'
			'cd /local/src/isaac-app/\n'
			'./compose test master up -d'
		)

	def do_regression_test(self):
		self.interface.user_instruction(
			'Regression Test\n\n'
			'- Do the manual tests from sheets.google.com\n'
			'- Run the Automated Regression tests (https://github.com/jsharkey13/isaac-selenium-testing)'
		)

	def do_create_release_tags(self):
		tags_already_exist = self.target_app_version in RoboOp.reverse_chron_app_tags and self.target_api_version in RoboOp.reverse_chron_api_tags
		if tags_already_exist:
			self.interface.warn('Skipping tagging because target versions already exist')
		else:
			self.tag_isaac_app()
			if not self.app_only_release:
				self.tag_isaac_api()

	def do_take_backup(self):
		self.interface.user_instruction('Now would be a good time to make backups')

	def do_build_app(self):
		self.interface.user_instruction(
			'Wait until Jenkins has finished building, then, build the app in Docker by calling these commands on isaac-3\n\n'
			'cd /local/src/isaac-app/\n'
			'./build-in-docker.sh {}'.format(self.target_app_version)
		)

	def do_bring_old_staging_down(self):
		self.interface.user_instruction(
			'Bring the old version of staging down (You might want to warn the content team)\n'
			'On isaac-3, run "docker ps" to check the version of staging but you should be able to:\n\n'
			'./compose staging {} down -v\n\n'
			'("./compose staging master down -v" is another common option)'.format(self.current_app_tag)
		)

	def do_bring_new_staging_up(self):
		self.interface.user_instruction(
			'Bring the new version of staging up by running the following commands on isaac-3\n\n'
			'./compose staging {} up -d'.format(self.target_app_version)
		)

	def do_bring_test_down(self):
		self.interface.user_instruction(
			'Bring test down on isaac-3\n\n'
			'./compose test master down -v'
		)

	def do_bring_down_old_etl(self):
		self.interface.user_instruction(
			'Bring down the old ETL on isaac-3\n\n'
			'./compose-etl {} down -v'.format(self.current_app_tag)
		)

	def do_bring_up_new_etl(self):
		self.interface.user_instruction(
			'Bring up the new ETL on isaac-3\n\n'
			'./compose-etl {} up -d'.format(self.target_app_version)
		)

	def do_bring_up_live(self):
		if self.app_only_release:
			self.interface.user_instruction(
				'Bring up the new live app (this is an app only release)\n\n'
				'./compose-live {new_version} up -d app-live-{new_version}\n'.format(new_version=self.target_app_version)
			)
		else:
			self.interface.user_instruction(
				'Bring up the new version of isaac-app and isaac-api\n\n'
				'./compose-live {new_version} up -d'.format(new_version=self.target_app_version)
			)

	def do_stop_old_app(self):
		self.interface.user_instruction(
			'Stop the old version of the app\n\n'
			'docker stop app-live-{}'.format(self.current_app_tag)
		)

	def do_reload_router(self):
		self.interface.user_instruction(
			'Reload the router\n\n'
			'../isaac-router/reload-router-config'
		)
		self.interface.notify('You should now test that the site serves up the new version')

	def do_monitor_new_services(self):
		self.interface.user_instruction(
			'Update the monitoring targets\n\n'
			'cd ../isaac-monitor\n'
			'python monitor_services.py'
		)

	def do_set_reminder_to_bring_down_old_site(self):
		if self.app_only_release:
			self.interface.user_instruction(
				'In slack write a reminder to bring down the old version of the site (rather than just stopping the container)\n\n'
				'/remind me in 5 days to bring down the old version of Isaac on isaac-3 using  "docker rm -v app-live-{}"'.format(self.current_app_tag)
			)
		else:
			self.interface.user_instruction(
				'In slack write a reminder to bring down the old version of the site (rather than just stopping the container)\n\n'
				'/remind me in 5 days to bring down the old version of Isaac on isaac-3 using  "./compose-live {} down -v"'.format(self.current_app_tag)
			)

	def do_write_changelog(self):
		self.interface.user_instruction('Write the release changelog in GitHub - https://github.com/ucam-cl-dtg/isaac-app/releases')

	def tag_isaac_app(self):
		self.interface.notify('Tagging isaac-app')
		self.check_current_branch_status()
		
		if not self.app_only_release:
			self.update_app_js_api_provider(self.target_api_version)
		self.update_package_json_version(self.target_app_version)
		self.git_add_and_commit('Release {}'.format(self.target_app_version), 'app/js/app/app.js', 'package.json')
		self.git_tag(self.target_app_version)
		
		next_app_version = RoboOp.next_version(self.target_app_version, SemanticVersion.patch)
		self.update_package_json_version(next_app_version + '-SNAPSHOT')
		self.git_add_and_commit('Increment version', 'package.json')

		self.git_push(self.target_app_version)
		self.interface.notify('Tagging successful')

	def tag_isaac_api(self):
		self.interface.notify('Tagging isaac-api')
		os.chdir('../isaac-api')
		self.check_current_branch_status()
		
		self.update_pom_xml_version(self.target_api_version)
		self.git_add_and_commit('Release {}'.format(self.target_api_version), 'pom.xml')
		self.git_tag(self.target_api_version)
		
		next_api_version = RoboOp.next_version(self.target_api_version, SemanticVersion.patch)
		self.update_pom_xml_version(next_api_version + '-SNAPSHOT')
		self.git_add_and_commit('Increment version', 'pom.xml')

		self.git_push(self.target_api_version)
		os.chdir('../isaac-app') # return to previous directory
		self.interface.notify('Tagging successful')

	def check_current_branch_status(self):
		git_status = subprocess.check_output(r'git fetch && git status', shell=True)

		if 'On branch master' not in git_status:
			options = {'m': 'checkout master', 'q': 'quit'}
			user_decision = self.interface.confirm(
				'Warning: Branch is not on master, automated tagging only works for master\n\nStatus:\n{}\n\nCheckout (m)aster or (q)uit?'.format(git_status), options=options)
			if user_decision == 'checkout master':
				subprocess.check_output('git checkout master', shell=True)
			elif user_decision == 'quit':
				raise Exception('User initiated cancel as current branch is not on master')

		if "Your branch is behind" in git_status:
			options = {'c': 'continue', 'p': 'pull', 'q': 'quit'}
			user_decision = self.interface.confirm(
				'Warning: Your branch is behind remote repo\n\nStatus:\n{}\n\nDo you want to (c)ontinue (p)ull or (q)uit?'.format(git_status), options=options)
			if user_decision == 'pull':
				subprocess.check_output('git pull', shell=True)
			elif user_decision == 'quit':
				raise Exception('User initiated cancel as current branch is not up-to-date')

	def update_app_js_api_provider(self, version):
		api_provider_regex = re.compile(r'apiProvider\.urlPrefix\("/api/v\d+\.\d+\.\d+/api"\);')
		new_api_provider_string = 'apiProvider.urlPrefix("/api/{}/api");'.format(version)

		with open('app/js/app/app.js', 'r+') as file:
			new_file_content = []
			line_found = False
			for line in file:
				new_line, no_of_substitutions = api_provider_regex.subn(new_api_provider_string, line)
				line_found |= bool(no_of_substitutions)
				new_file_content.append(new_line)
			if not line_found:
				raise Exception('Error: Could not find apiProvider.urlPrefix not found in app/js/app/app.js')

			file.seek(0)
			file.truncate()
			file.write(''.join(new_file_content))

	def update_package_json_version(self, version):
		with open('package.json', 'r+') as file:
			package_json = json.load(file, object_pairs_hook=OrderedDict)
			package_json['version'] = version
			file.seek(0)
			file.truncate()
			json.dump(package_json, file, indent=2, separators=(',', ': '))

	def update_pom_xml_version(self, version):
		# TODO an XML parsed solution exists in git but would need to sort out namespaces to get ElementTree to format correctly
		api_provider_regex = re.compile(r'<segue\.version>\d+\.\d+\.\d+(\-SNAPSHOT)?</segue\.version>')
		new_api_provider_string = '<segue.version>{}</segue.version>'.format(version[1:]) # [1:] is used as pom.xml does not want the 'v' in vX.X.X

		with open('pom.xml', 'r+') as file:
			new_file_content = []
			line_found = False
			for line in file:
				new_line, no_of_substitutions = api_provider_regex.subn(new_api_provider_string, line)
				line_found |= bool(no_of_substitutions)
				new_file_content.append(new_line)
			if not line_found:
				raise Exception('Error: Could not find the segue.version element in pom.xml')

			file.seek(0)
			file.truncate()
			file.write(''.join(new_file_content))

	def git_add_and_commit(self, message, *files):
		subprocess.check_output('git add ' + ' '.join(files), shell=True)
		subprocess.check_output('git commit -m "{}"'.format(commit_message), shell=True)

	def git_tag(self, tag_version):
		subprocess.check_output('git tag -a {target_version} -m "Release {target_version}"'.format(target_version=tag_version), shell=True)

	def git_push(self, tag_name):
		subprocess.check_output('git push origin master', shell=True)
		subprocess.check_output('git push origin {}'.format(tag_name), shell=True)

	def release(self):
		for i, action in enumerate(self.actions):
			self.interface.notify_of_next_stage(action)
			getattr(self, action)()
		self.interface.notify('Release procedure completed!')


class RoboOpCommandLineInterface(object):
	parser_specific_properties = {'nargs', 'choices', 'default', 'help'}
	prompt = 'RoboOp>'

	def report_useful_info(self, useful_key_values):
		for key, value in useful_key_values.items():
			print '{}: {}'.format(key, value)
		print

	def get_required_settings(self, settings_schema):
		arg_populated_settings = self.parse_command_line_args(settings_schema)
		settings = self.ask_for_remaining_args(settings_schema, arg_populated_settings)
		return settings

	def parse_command_line_args(self, settings_schema):
		parser = argparse.ArgumentParser(description='Automate the release procedure.')
		for name, properties in settings_schema.items():
			parser_properties = {key: value for key, value in properties.items() if key in RoboOpCommandLineInterface.parser_specific_properties}
			parser.add_argument('--{name}'.format(name=name), **parser_properties)
		arguments = parser.parse_args()
		return arguments.__dict__

	def ask_for_remaining_args(self, settings_schema, arg_populated_settings):
		result = dict(arg_populated_settings)
		for name, properties in settings_schema.items():
			while result[name] is None:
				user_input = self.ask_to_acknowledge(properties['prompt'])
				input_in_choices = 'choices' in properties and user_input in properties['choices']
				input_matches_regex = 'regex' in properties and properties['regex'].match(user_input)  
				if input_in_choices or input_matches_regex:
					result[name] = user_input
				else:
					print('Error: Value entered is not a valid choice')
				print
		return result

	def notify(self, message):
		print('Note: ' + message)

	def notify_of_next_stage(self, stage):
		print('\n| STAGE: {} |'.format(stage.upper()))

	def warn(self, message):
		print('Warning: ' + message)

	def ask_to_acknowledge(self, message):
		return raw_input(message + '\n' + RoboOpCommandLineInterface.prompt)

	def user_instruction(self, message):
		return self.ask_to_acknowledge('Instruction: ' + message)

	def confirm(self, message, options={'y':True, 'n':False}):
		response = ''
		while response.lower() not in [option.lower() for option in options]:
			if response != '':
				print('Response not a valid option: {}'.format('/'.join(options)))
			response = self.ask_to_acknowledge(message + ' ({})\n'.format('/'.join(options)))
		return options[response.lower()]

if __name__ == '__main__':
	robo_op = RoboOp(interface=RoboOpCommandLineInterface())
	robo_op.release()
