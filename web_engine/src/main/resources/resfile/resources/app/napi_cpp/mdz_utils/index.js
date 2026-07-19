const path = require('path');
const mdzUtils = require('/data/storage/el1/bundle/libs/arm64/mdz_utils.node');
const sevenZlibPth = '/data/storage/el1/bundle/libs/arm64/7z.so';

const genOrDecompressMdz = (inputPath, destPath, instruction, compressPassword, decompressPassword) => {
    return mdzUtils.genOrDecompressMdz(inputPath, destPath, instruction, sevenZlibPth, compressPassword, decompressPassword);
};

module.exports = {
    genOrDecompressMdz
};
