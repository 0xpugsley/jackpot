async function main() {
  saveABI("abi");
}

function saveABI(dir) {
  const fs = require("fs");

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const jackpotArtifact = artifacts.readArtifactSync("Jackpot");
  const randomVRFArtifact = artifacts.readArtifactSync("RandomVRF");

  fs.writeFileSync(
    dir + "/Jackpot.json",
    JSON.stringify(jackpotArtifact, null, 2)
  );

  fs.writeFileSync(
    dir + "/RandomVRF.json",
    JSON.stringify(randomVRFArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
