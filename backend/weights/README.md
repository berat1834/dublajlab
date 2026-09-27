# Wav2Lip Model Weights

This directory is intended to store the pre-trained model weights for the Wav2Lip lip synchronization feature.

**Important Note:**
Model weight files (`.pth`) are extremely large and **MUST NOT** be committed to Git. The `.gitignore` file is configured to exclude them.

### Required Files:
In order for the `lip_sync_service.py` to work properly in production, the following files must be manually downloaded and placed in this directory:

1. **`wav2lip_gan.pth`**: The primary Wav2Lip GAN model weights.
2. **`s3fd.pth`**: The face detection model weights (used for extracting faces during inference).

### Installation (for Server/Local Admin):
Please refer to the official Wav2Lip repository or your internal model artifact storage to download these files and place them directly here.
