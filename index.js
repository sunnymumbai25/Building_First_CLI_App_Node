const musette = require('commander');
const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');

const files = require('./lib/files');
const github = require('./lib/github_credentials');
const inquirer = require('./lib/inquirer');
const repo = require('./lib/create_a_repo');

musette
	.command('init')
	.description('Draw app banner')
	.action(() => {
		clear();
		console.log(
			chalk.magenta(
				figlet.textSync('musette', { horizontalLayout: 'full' })
			)
		);
});

musette
	.command('octocheck')
	.description('Check user GitHub credentials')
	.action(async () => {
		let token = github.getStoredGitHubToken();
		if (!token) {
			await github.setGitHubCredentials();
			token = await github.registerNewToken();
		}
		console.log(token);
	});

musette
	.command('create_repo')
	.description('Create a new repository on GitHub')
	.action(async() => {
		const getGitHubToken = async () => {
			let token = github.getStoredGitHubToken();
			if (token) {
				return token;
			}

			await github.setGitHubCredentials();

			token = await github.registerNewToken();
			return token;
		}
		try {
			const token = await getGitHubToken();
			github.gitHubAuth(token);

			const url = await repo.createRemoteRepository();

			await repo.createGitIgnore();

			const complete = await repo.setupRepository(url);

			if (complete) {
				console.log(chalk.green('All done!'));
			}
		} catch (error) {
			if (error) {
				switch (error.status) {
					case 401: 
						console.log(chalk.red('Couldn\'t log you in. Please provide correct credentials or token.'));
						break;
					case 422:
						console.log(chalk.red('There already exists a remote repository with the same name.'));
						break;
					default:
						console.log(error);
						break;
				}
			}
		}
	});

musette.parse(process.argv);

if (!musette.args.length) {
	musette.help();
}