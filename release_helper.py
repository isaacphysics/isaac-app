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
	current_app_tag = json.loads(requests.get('https://api.github.com/repos/ucam-cl-dtg/isaac-app/tags').content)[0]['name']
	current_api_tag = json.loads(requests.get('https://api.github.com/repos/ucam-cl-dtg/isaac-api/tags').content)[0]['name']
	tag_regex = re.compile(r'^v(?P<{}>\d+)\.(?P<{}>\d+)\.(?P<{}>\d+)$'.format(SemanticVersion.major.name, SemanticVersion.minor.name, SemanticVersion.patch.name))
	ability_indicator_prefix = 'do_'
	default_task_order = [
		'take_backup',
		'release_test',
		'regression_test'
		'create_release_tags',
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
		'set_reminder_to_bring_down_old_site'
		'write_changelog',
	]

	@classmethod
	def get_abilities(cls):
		# TODO MT explain what I'm doing hwew
		return [attribute[len(cls.ability_indicator_prefix):] for attribute in dir(cls) if attribute.startswith(cls.ability_indicator_prefix)]

	@classmethod
	def generate_settings_schema(cls):
		release_types = ['app-only', 'full']
		return OrderedDict(
			actions= {
				'nargs': '+',
				'choices': cls.get_abilities(),
				'default': cls.default_task_order,
				'help': 'list of actions to perform',
			},
			target_app_version= {
				'nargs': '?',
				'help': 'target app version tag',
				'regex': RoboOp.tag_regex,
				'prompt': 'What is the target app version (latest app tag: {})'.format(RoboOp.current_app_tag)
			},
			target_api_version= {
				'nargs': '?',
				'help': 'target api tag version',
				'regex': RoboOp.tag_regex,
				'prompt': 'What is the target api version (latest api tag: {})'.format(RoboOp.current_api_tag)
			}
		)

	@classmethod
	def get_project_info(cls):
		return {
			'Latest isaac app tag:': RoboOp.current_app_tag,
			'Latest isaac api tag:': RoboOp.current_api_tag
		}

	@classmethod
	def next_version(cls, initial_version, type_of_release):
		match = cls.tag_regex.match(initial_version)

		next_version_description = []
		for version_type in list(SemanticVersion):
			if type_of_release is version_type:
				next_version_description.append(str(int(match.group(version_type.name)) + 1)) 
			else:
				next_version_description.append(match.group(version_type.name))

		return 'v' + '.'.join(next_version_description)

	def __init__(self, interface):
		# TODO MT a possible improvement would be to pull app and api from the internet into a temporary directory to work with
		self.interface = interface
		settings_schema = RoboOp.generate_settings_schema()

		self.interface.report_useful_info(RoboOp.get_project_info())
		
		settings = self.interface.get_required_settings(settings_schema)
		self.__dict__.update(settings) # make settings "dot accessible" on self

		self.app_only_release = self.target_api_version == RoboOp.current_api_tag

	def __getattr__(self, name):
		# if I don't have the attribute you're asking for check if it is an ability of mine
		if name in RoboOp.get_abilities():
			return getattr(self, RoboOp.ability_indicator_prefix + name)

	def do_take_backup(self):
		self.interface.user_instruction('Now would be a good time to take backups')

	def do_release_test(self):
		self.interface.user_instruction('Deploy test for master on isaac-3 using the commands:\ncd /local/src/isaac-app/\n./compose test master up -d')

	def do_create_release_tags(self):
		# TODO MT improve by checking all existing tags to accomodate rollback
		tags_already_exist = self.target_app_version == RoboOp.current_app_tag and self.target_api_version == RoboOp.current_api_tag
		if tags_already_exist:
			self.interface.warn('Skipping tagging because target versions already exist')
		else:
			self.tag_isaac_app()
			if not self.app_only_release:
				self.tag_isaac_api()

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
		xml_namespace = {'ns': 'http://maven.apache.org/POM/4.0.0'}
		filename = 'pom.xml'
		tree = ElementTree.parse(filename)
		segue_version = tree.find('ns:properties', xml_namespace).find('ns:segue.version', xml_namespace)
		segue_version.text = version
		tree.write(filename)

	def git_add_and_commit(self, message, *files):
		# subprocess.check_output('git add ' + ' '.join(files), shell=True)
		# subprocess.check_output('git commit -m "{}"'.format(commit_message), shell=True)
		pass

	def git_tag(self, tag_version):
		# subprocess.check_output('git tag -a {target_version} -m "Release {target_version}"'.format(target_version=tag_version), shell=True)
		pass

	def git_push(self, tag_name):
		# subprocess.check_output('git push origin master', shell=True)
		# subprocess.check_output('git push origin {}'.format(tag_name), shell=True)
		pass		

	def release(self):
		for action in self.actions:
			self.interface.notify('Starting {}'.format(action))
			getattr(self, action)()


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
				user_input = self.ask(properties['prompt'])
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

	def warn(self, message):
		print('Warning: ' + message)

	def ask_to_acknowledge(self, message):
		return raw_input(message + '\n' + RoboOpCommandLineInterface.prompt)

	def user_instruction(self, message):
		return self.ask_to_acknowledge('\nInstruction: ' + message)

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
