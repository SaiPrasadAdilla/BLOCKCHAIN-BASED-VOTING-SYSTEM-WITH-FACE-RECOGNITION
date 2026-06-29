import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  FaceInfo,
  ImageInfo,
  FaceDetectionResult,
  FaceVerificationResult,
} from '../models/facial-recognition.model';

@Injectable({ providedIn: 'root' })
export class FaceRecognitionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  registerFace(userId: string, image: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', image);
    return this.http.post(
      `${this.apiUrl}/facial-recognition/register/${userId}`,
      formData,
    );
  }

  verifyFace(userId: string, image: File): Observable<FaceVerificationResult> {
    const formData = new FormData();
    formData.append('image', image);
    return this.http.post<FaceVerificationResult>(
      `${this.apiUrl}/facial-recognition/verify/${userId}`,
      formData,
    );
  }

  authenticateWithFace(image: File): Observable<FaceVerificationResult> {
    const formData = new FormData();
    formData.append('image', image);
    return this.http.post<FaceVerificationResult>(
      `${this.apiUrl}/facial-recognition/authenticate`,
      formData,
    );
  }

  updateFace(userId: string, image: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', image);
    return this.http.put(
      `${this.apiUrl}/facial-recognition/update/${userId}`,
      formData,
    );
  }

  deleteFace(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/facial-recognition/user/${userId}`);
  }

  getFaceInfo(userId: string): Observable<FaceInfo> {
    return this.http.get<FaceInfo>(
      `${this.apiUrl}/facial-recognition/user/${userId}`,
    );
  }

  uploadImage(image: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', image);
    return this.http.post(`${this.apiUrl}/facial-recognition/upload`, formData);
  }

  verifyFaceGeneric(
    image: File,
    referenceImage?: File,
  ): Observable<FaceVerificationResult> {
    const formData = new FormData();
    formData.append('image', image);
    if (referenceImage) {
      formData.append('referenceImage', referenceImage);
    }
    return this.http.post<FaceVerificationResult>(
      `${this.apiUrl}/facial-recognition/verify`,
      formData,
    );
  }

  listImages(): Observable<ImageInfo[]> {
    return this.http.get<ImageInfo[]>(
      `${this.apiUrl}/facial-recognition/images`,
    );
  }

  getImageInfo(imagePath: string): Observable<ImageInfo> {
    return this.http.get<ImageInfo>(
      `${this.apiUrl}/facial-recognition/image/${imagePath}`,
    );
  }

  deleteImage(imagePath: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/facial-recognition/image/${imagePath}`,
    );
  }

  detectFace(image: File): Observable<FaceDetectionResult> {
    const formData = new FormData();
    formData.append('image', image);
    return this.http.post<FaceDetectionResult>(
      `${this.apiUrl}/facial-recognition/detect`,
      formData,
    );
  }
}
