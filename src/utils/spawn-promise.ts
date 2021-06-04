import childProcess from 'child_process';

export const spawnPromise = function (command, argsarray, envOptions) {
	return new Promise((resolve, reject) => {
		const childProc = childProcess.spawn(command, argsarray, envOptions || { env: process.env, cwd: process.cwd() });
		const resultBuffers = [];

		childProc.stdout.on('data', buffer => {
			console.log(buffer.toString());
			resultBuffers.push(buffer);
		});

		childProc.stderr.on('data', buffer => console.error(buffer.toString()));

		childProc.on('exit', (code, signal) => {
			if (code || signal) {
				reject(`${command} failed with ${code || signal}`);
			} else {
				resolve(Buffer.concat(resultBuffers).toString().trim());
			}
		});
	});
};