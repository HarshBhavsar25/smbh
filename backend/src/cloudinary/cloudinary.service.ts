import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: 'dfhvmrhde',
      api_key: '562323847148584',
      api_secret: 'O_bw4QDrRVyWb5YfVLfVTmcXgc8',
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'hostel'): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Upload failed: no result returned'));
          resolve(result.secure_url);
        }
      );
      uploadStream.end(file.buffer);
    });
  }
}
