import subprocess
import argparse
import requests
import json
import re
from collections import OrderedDict
from enum import Enum

class SemanticVersion(Enum):
	major=0
	minor=1
	patch=2

class RoboOp(object):
	latest_app_tag = json.loads(requests.get('https://api.github.com/repos/ucam-cl-dtg/isaac-app/tags').content)[0]['name']
	latest_api_tag = json.loads(requests.get('https://api.github.com/repos/ucam-cl-dtg/isaac-api/tags').content)[0]['name']
	tag_regex = re.compile(r'^v(?P<{}>\d+)\.(?P<{}>\d+)\.(?P<{}>\d+)$'.format(SemanticVersion.major.name, SemanticVersion.minor.name, SemanticVersion.patch.name))
	ability_indicator_prefix = 'do_'

	@classmethod
	def get_abilities(cls):
		return [attribute[len(cls.ability_indicator_prefix):] for attribute in dir(cls) if attribute.startswith(cls.ability_indicator_prefix)]

	@classmethod
	def generate_settings_schema(cls):
		release_types = ['app-only', 'full']
		return OrderedDict(
			actions= {
				'nargs': '+',
				'choices': cls.get_abilities(),
				'default': cls.get_abilities(),
				'help': 'list of actions to perform',
			},
			target_app_version= {
				'nargs': '?',
				'help': 'target app version tag',
				'regex': RoboOp.tag_regex,
				'prompt': 'What is the target app version (latest app tag: {})'.format(RoboOp.latest_app_tag)
			},
			target_api_version= {
				'nargs': '?',
				'help': 'target api tag version',
				'regex': RoboOp.tag_regex,
				'prompt': 'What is the target api version (latest api tag: {})'.format(RoboOp.latest_api_tag)
			}
		)

	@classmethod
	def get_project_info(cls):
		return {
			'Latest isaac app tag:': RoboOp.latest_app_tag,
			'Latest isaac api tag:': RoboOp.latest_api_tag
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
		self.interface = interface
		settings_schema = RoboOp.generate_settings_schema()

		self.interface.report_useful_info(RoboOp.get_project_info())
		
		settings = self.interface.get_required_settings(settings_schema)
		self.__dict__.update(settings) # make settings . accessible on self

		self.app_only_release = self.target_api_version == RoboOp.latest_api_tag

	def __getattr__(self, name):
		# if I don't have the attribute you're asking for check if it is an ability of mine
		if name in RoboOp.get_abilities():
			return getattr(self, RoboOp.ability_indicator_prefix + name)

	def do_tag(self):
		# TODO MT improve by checking all existing tags to accomodate rollback
		tags_already_exist = self.target_app_version == RoboOp.latest_app_tag and self.target_api_version == RoboOp.latest_api_tag
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
		self.git_add_and_commit('Release {}'.format(self.target_app_version), 'app.js', 'package.json')
		self.git_tag(self.target_app_version)
		
		next_app_version = RoboOp.next_version(self.target_app_version, SemanticVersion.patch)
		print next_app_version
		self.update_package_json_version(next_app_version + '-SNAPSHOT')
		self.git_add_and_commit('Increment version', 'package.json')

		self.git_push(self.target_app_version)

	def tag_isaac_api(self):
		self.interface.notify('Tagging isaac-api')
		subprocess.check_output('cd ../isaac-api', shell=True)
		self.check_current_branch_status()
		
		self.update_pom_xml_version(self.target_api_version)
		self.git_add_and_commit('Release {}'.format(self.target_api_version), 'pom.xml')
		self.git_tag(self.target_api_version)
		
		next_api_version = RoboOp.next_version(self.target_api_version, SemanticVersion.patch)
		print next_api_version
		self.update_pom_xml_version(next_api_version + '-SNAPSHOT')
		self.git_add_and_commit('Increment version', 'pom.xml')

		self.git_push(self.target_api_version)

	def check_current_branch_status(self):
		git_status = subprocess.check_output(r'git fetch && git status', shell=True)
		
		if 'On branch master' not in git_status:
			options = {'m': 'checkout master', 'q': 'quit'}
			user_decision = self.interface.confirm(
				'Branch is not on master, automated tagging only works for master\n\nStatus:\n{}\n\nCheckout (m)aster or (q)uit?'.format(git_status), options=options)
			if user_decision == 'checkout master':
				subprocess.check_output('git checkout master', shell=True)
			elif user_decision == 'quit':
				raise Exception('User initiated cancel as current branch is not on master')

		if "Your branch is behind" in git_status:
			options = {'c': 'continue', 'p': 'pull', 'q': 'quit'}
			user_decision = self.interface.confirm(
				'Your branch is behind remote repo\n\nStatus:\n{}\n\nDo you want to (c)ontinue (p)ull or (q)uit?'.format(git_status), options=options)
			if user_decision == 'pull':
				subprocess.check_output('git pull', shell=True)
			elif user_decision == 'quit':
				raise Exception('User initiated cancel as current branch is not up-to-date')

	def update_app_js_api_provider(self, version):
		# EDIT app.js TO apiProvider.urlPrefix("/api/vN.E.W/api")
		pass

	def update_package_json_version(self, version):
		# EDIT package.json TO version="N.E.W",
		pass

	def update_pom_xml_version(self, version):
		# EDIT pom.xml TO <segue.version>N.E.W</segue.version>
		pass

	def git_add_and_commit(self, message='RoboOp commit', *files):
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

	def ask(self, message):
		return raw_input(message + '\n' + RoboOpCommandLineInterface.prompt)

	def confirm(self, message, options={'y':True, 'n':False}):
		response = ''
		while response.lower() not in [option.lower() for option in options]:
			if response != '':
				print('Response not a valid option: {}'.format('/'.join(options)))
			response = self.ask(message + ' ({})\n'.format('/'.join(options)))
		return options[response.lower()]


if __name__ == '__main__':
	robo_op = RoboOp(interface=RoboOpCommandLineInterface())
	robo_op.release()
