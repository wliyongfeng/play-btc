const bitcoin = require("bitcoinjs-lib");

// 定义btc网络
const network = bitcoin.networks.testnet;
// 如果是主网，用这句，注释掉上边那句
// const network = bitcoin.networks.bitcoin;

const privateKey = "140c4e5d335f8f78a523f4bced76756d9726b83fe0aa97703c823d140b93c6e9";

// 获取ECPair，用于签名。参数可以直接是私钥hex格式，也可以是WIF格式。
function getEcPair(privateKey) {
  if (/^(0x)?[\da-zA-Z]{64}$/.test(privateKey)) {
    return bitcoin.ECPair.fromPrivateKey(Buffer.from(privateKey, "hex"), {
      network
    });
  }
  return bitcoin.ECPair.fromWIF(privateKey, network);
}

function constructTx() {
  // 初始化 transaction builder，用于构造交易
  const txb = new bitcoin.TransactionBuilder(network);
  txb.setVersion(1); // 设置要构造的交易version，1和2都可以，2支持segwit

  /**
   * 构造交易主要分为三步
   * 1. 添加inputs
   * 2. 添加outputs
   * 3. 签名所有的inputs
   */

  /**
   * 第一步，添加inputs，这里我们只添加一个input
   * 参数第一个是要花费的交易id，第二个是output index
   * unspents 列表通过api查询获得
   * 测试网api：https://api.chainx.org/bitx/testnet/${addr}/utxos
   * 主网api: https://api.chainx.org/bitx/mainnet/${addr}/utxos
   */
  txb.addInput("d320034c13538d9c2b52d0a3e7ec3fba9d0267d5532cbc8723d1add85640afe5", 0);

  // 第二步，添加output，这里我们添加一个p2pkh的output
  txb.addOutput("mqj6dQ2gxY4ZgGYvD5LDN3L13yA1L52EEX", 990000);
  addOpReturn(txb, "5ScHcWEdkhuMAos2mgQY6rxSK7WExZQXKif1Eh8d61ruFSQV");

  /**
   * 第三步，签名
   */
  const pair = getEcPair(privateKey);
  const inputLength = 1; // 填写实际input数量
  for (let i = 0; i < inputLength; i++) {
    txb.sign(i, pair)
  }

  const finalRawTx = txb.build().toHex();
  console.log(finalRawTx);
}

function addOpReturn(txb, opReturnText) {
  // 添加一个OP_RETURN的output
  const hex = toHex(opReturnText); // 转化为HEX
  const embed = bitcoin.payments.embed({
    data: [Buffer.from(hex, "hex")]
  });
  txb.addOutput(embed.output, 0);
}

function toHex(text) {
  // utf8 to latin1
  const s = unescape(encodeURIComponent(text))
  let h = ''
  for (var i = 0; i < s.length; i++) {
    h += s.charCodeAt(i).toString(16)
  }
  return h
}

constructTx();
