import os
import requests
import zipfile

class DataDownloader:
    def __init__(self, file_id, destination):
        self.file_id = file_id
        self.destination = destination

    def download_dataset(self):
        print(f"Downloading dataset from Google Drive ID: {self.file_id}...")
        def get_confirm_token(response):
            for key, value in response.cookies.items():
                if key.startswith('download_warning'):
                    return value
            return None

        def save_response_content(response):
            CHUNK_SIZE = 32768
            with open(self.destination, "wb") as f:
                for chunk in response.iter_content(CHUNK_SIZE):
                    if chunk:
                        f.write(chunk)

        URL = "https://docs.google.com/uc?export=download"
        session = requests.Session()
        response = session.get(URL, params={'id': self.file_id}, stream=True)
        token = get_confirm_token(response)

        if token:
            params = {'id': self.file_id, 'confirm': token}
            response = session.get(URL, params=params, stream=True)

        save_response_content(response)
        print("Download complete.")

    def extract_zip(self):
        print(f"Extracting {self.destination}...")
        if not os.path.exists('input'):
            os.makedirs('input')

        with zipfile.ZipFile(self.destination, 'r') as zip_ref:
            zip_ref.extractall('./input/')
        print("Extraction complete.")

if __name__ == "__main__":
    FILE_ID = '1VaYonsJUovGO1AamMQuC2LN47AZ4pkTm'
    DST_LOC = './self_driving_dataset.zip'
    
    downloader = DataDownloader(FILE_ID, DST_LOC)
    if not os.path.exists(DST_LOC):
        downloader.download_dataset()
    else:
        print("Zip file already exists, skipping download.")
    
    downloader.extract_zip()
