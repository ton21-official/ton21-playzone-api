const { mnemonicToPrivateKey } = require('@ton/crypto');

(async () => {
  const seed = "select language tuna satoshi essence cloud kick network sustain green cage monitor unique judge plastic worth aim flower kiwi found wave cricket only daring"; // вставь сюда своими словами
  const words = seed.trim().split(/\s+/);

  const keyPair = await mnemonicToPrivateKey(words);
  console.log("PRIVATE KEY (HEX):", Buffer.from(keyPair.privateKey).toString("hex"));
})();
