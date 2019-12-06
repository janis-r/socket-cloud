import * as crypto from "crypto";

const rawBuffer = Buffer.from("abcd");
console.log('>> raw buffer', rawBuffer);

const maskBytes = crypto.randomBytes(4);
console.log('>> maskBytes', maskBytes);

const maskedBuffer = Buffer.from(rawBuffer);
for (let i = 0; i < maskedBuffer.length; i++) {
    // console.log('>>>', i % 4, i & 3)
    maskedBuffer[i] ^= maskBytes[i & 3];
}

console.log('>> masked buffer 1', maskedBuffer);
console.log('>> masked buffer 2', applyXorMask(rawBuffer, maskBytes));

const unMaskedBuffer = Buffer.from(maskedBuffer);
for (let i = 0; i < unMaskedBuffer.length; i++) {
    unMaskedBuffer[i] ^= maskBytes[i & 3];
}
console.log('>> un-masked buffer 1', unMaskedBuffer);
console.log('>> un-masked buffer 2', applyXorMask(maskedBuffer, maskBytes));


function applyXorMask(buffer: Buffer, mask: Buffer): Buffer {
    const bufferLength = buffer.length;
    const maskLength = mask.length;
    for (let i = 0; i < bufferLength; i++) {
        buffer[i] ^= maskBytes[i % maskLength];
    }
    return buffer;
}

// applyXorMask(buffer, maskBytes);

