"use strict";
const AWS = require("aws-sdk");
const sharp = require("sharp");
const { extname, basename } = require("path");

const S3 = new AWS.S3();

module.exports.handler = async ({ Records: records }, context) => {
  try {
    await Promise.all(
      records.map(async (record) => {
        const { key } = record.s3.objectId;

        const image = await S3.getObject({
          Bucket: process.env.bucket,
          Key: key,
        }).promise();

        const optimize = await sharp(image.Body)
          .resize(1280, 720, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .toFormat("jpeg", { progressive: true, quality: 50 })
          .toBuffer();
        await S3.putObject({
          Body: optimize,
          Bucket: process.env.bucket,
          ContentType: "image/jpeg",
          Key: `compressed/${basename(key, extname(key))}`,
        }).promise();
      })
    );
  } catch (error) {
    return error;
  }
};
