#!/opt/homebrew/bin/deno run --allow-run --allow-read

const dirPath = Deno.realPathSync(".");
const buildFolder = `${dirPath}/docs`
const excludedPaths = [buildFolder];

for await (const event of Deno.watchFs(dirPath)) {
    for (const path of event.paths) {
        // Skip excluded paths
        if (excludedPaths.some(excluded => path.startsWith(excluded))) {
            continue;
        }
        if (event.kind === "modify" || event.kind === "create" || event.kind === "remove") {
            console.log(`File changed: ${path}`);
            // Execute your script or command here
            const process = new Deno.Command(`${dirPath}/build.sh`);
            process.spawn()
        }
    }
}
