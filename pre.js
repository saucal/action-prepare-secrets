( async function () {

	const core = require( '@actions/core' );

	const customSecrets = core.getInput( 'custom-secrets', { required: false } );
	const githubSecrets = core.getInput( 'github-secrets', { required: false } );

	if ( ! customSecrets ) {
		console.log( 'No custom secrets provided, skipping...' );
		core.exportVariable( 'github-secrets', githubSecrets );
		return; 
	}

	// Need to base64 decode twice
	customSecretsDecoded = Buffer.from( customSecrets, 'base64' ).toString( 'utf-8' );
	customSecretsDecoded = Buffer.from( customSecretsDecoded, 'base64' ).toString( 'utf-8' );

	core.exportVariable( 'custom-secrets', customSecretsDecoded );

	// Parse JSON and mask all secrets
	const secretsObj = JSON.parse( customSecretsDecoded );

	// Mask all secrets so they don't get exposed in logs
	for ( const key in secretsObj ) {
		if ( secretsObj.hasOwnProperty( key ) ) {
			core.setSecret( secretsObj[key] );
		}
	}

	console.log( 'Found ' + Object.keys( secretsObj ).length + ' custom secrets, all masked.' );
} )();
