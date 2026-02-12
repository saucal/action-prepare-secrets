( async function () {

	//     steps:
    //   - name: Prepare all secrets
    //     run: |
    //       if [ -n "${{ secrets.custom-secrets }}" ]; then
    //         CUSTOM_SECRETS=$(echo ${{ secrets.custom-secrets }} | base64 -di | base64 -di)
    //         echo "custom-secrets=$CUSTOM_SECRETS" >> $GITHUB_ENV  

    //         for key in $(echo "$CUSTOM_SECRETS" | jq -r 'keys[]'); do
    //           echo "::add-mask::$(echo "$CUSTOM_SECRETS" | jq -r --arg k "$key" '.[$k]')";
    //         done
    //       else 
    //         echo "custom-secrets=${{ toJSON(secrets) }}" >> $GITHUB_ENV; 
    //       fi


	const exec = require( '@actions/exec' );
	const core = require( '@actions/core' );
	const fs = require( 'fs' );


	const customSecrets = core.getInput( 'custom-secrets', { required: false } );

	if ( ! customSecrets ) {
		return; 
	}


	if ( core.getInput( 'run-pre', { required: true } ) == 'false' ) {
		return;
	}

	await exec.exec( 'mkdir', ['-p', '/home/runner/.ssh'] );
	await exec.exec( 'touch', ['/home/runner/.ssh/known_hosts'] );

	const remoteHost = core.getInput( 'env-host', { required: false } );
	if( remoteHost != '' ) {
		const remotePort = core.getInput( 'env-port', { required: false } );
		await exec.exec( 'bash', ['-c', 'ssh-keyscan -p "' + remotePort + '" -H "' + remoteHost + '" >> /home/runner/.ssh/known_hosts' ] );
	}

	const remoteKey = core.getInput( 'env-key', { required: false } );
	if( remoteKey != '' ) {
		const sock = '/tmp/ssh_agent.sock';
		if( ! fs.existsSync( sock ) ) {
			core.exportVariable( 'SSH_AUTH_SOCK', sock );
			process.env['SSH_AUTH_SOCK'] = sock;
			await exec.exec( 'ssh-agent', ['-a', sock] );
		}

		var i = 0;
		var keyPath;
		do {
			i++;
			keyPath = '/home/runner/.ssh/github_actions_' + i;
		} while	( fs.existsSync( keyPath ) );

		await exec.exec( 'bash', ['-c', 'echo "' + remoteKey + '" > ' + keyPath ] );
		await exec.exec( 'chmod', ['600', keyPath] );
		await exec.exec( 'bash', ['-c', 'ssh-add ' + keyPath ] );
	}

	const remotePass = core.getInput( 'env-pass', { required: false } );
	if( remotePass != '' ) {
		await exec.exec( 'sudo', ['apt-get', 'install', '-y', 'sshpass'] );
	}
} )();
