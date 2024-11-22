import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { FiPlusCircle, FiXCircle, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify'; // Import toast from react-toastify
import '../styles/AdvertisementManagement.css';

const AdvertisementManagement = () => {
  const [ads, setAds] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]); // Array to store both image and video files
  const [name, setName] = useState(''); // Input for advertisement name
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false); // Modal visibility
  const [previews, setPreviews] = useState([]); // Preview for image/video

  // Initialize Firebase storage
  const storage = getStorage();

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'AD'));
        const adsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAds(adsList);
      } catch (error) {
        console.error('Error fetching ads:', error);
        toast.error('Error fetching advertisements');
      }
    };

    fetchAds();
  }, []);

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles(files);

    const previewsList = files.map(file => URL.createObjectURL(file));
    setPreviews(previewsList); // Set previews for all files
  };

  const handleUpload = async () => {
    if (mediaFiles.length > 0 && name) {
      setUploading(true);
      const mediaData = [];

      // Upload each media file to Firebase Storage and categorize as img_url or vid_url
      for (const mediaFile of mediaFiles) {
        const storageRef = ref(storage, `ads/${mediaFile.name}`);
        await uploadBytes(storageRef, mediaFile);
        const fileUrl = await getDownloadURL(storageRef);

        if (mediaFile.type.startsWith('image/')) {
          mediaData.push({ img_url: fileUrl }); // Store as image
        } else if (mediaFile.type.startsWith('video/')) {
          mediaData.push({ vid_url: fileUrl }); // Store as video
        }
      }

      try {
        const docRef = await addDoc(collection(db, 'AD'), {
          name,
          mediaData, // Save mediaData containing img_url and/or vid_url
        });
        setAds([...ads, { id: docRef.id, name, mediaData }]);
        resetForm(); // Reset form after successful upload
        toast.success('Advertisement uploaded successfully!');
      } catch (e) {
        console.error('Error uploading ad: ', e);
        toast.error('Error uploading advertisement.');
      } finally {
        setUploading(false);
      }
    } else {
      toast.error('Please fill out all fields and select at least one image or video file.');
    }
  };

  const handleDelete = async (adId, mediaData) => {
    try {
      // Loop through all media URLs and delete from Firebase storage
      for (const media of mediaData || []) {
        const fileUrl = media.img_url || media.vid_url;
        const fileName = decodeURIComponent(fileUrl.split('/').pop().split('?')[0]);
        const storageRef = ref(storage, `ads/${fileName}`);

        await deleteObject(storageRef); // Delete from Firebase Storage
      }

      // Delete from Firestore
      await deleteDoc(doc(db, 'AD', adId));

      // Update the state to remove the deleted ad from the local state
      setAds(ads.filter(ad => ad.id !== adId));

      toast.success('Advertisement deleted successfully!');
    } catch (e) {
      console.error('Error deleting ad: ', e);
      toast.error('Error deleting advertisement.');
    }
  };

  const resetForm = () => {
    setMediaFiles([]);
    setPreviews([]);
    setName(''); // Reset name field
    setShowModal(false); // Close modal
  };

  return (
    <div className="page_container">
      {/* Upload Ad Button */}
      <button className="upload_ad_button" onClick={() => setShowModal(true)}>
        <FiPlusCircle /> Upload Ad
      </button>

      {/* Modal Form */}
      {showModal && (
        <div className="modal">
          <div className="modal_content">
            <h2>Upload Advertisement</h2>
            <form>
              <div className="input_field">
                <label htmlFor="name">Advertisement Name:</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter advertisement name"
                  required
                />
              </div>
              <div className="input_field">
                <label htmlFor="file">Upload Media (Image/Video):</label>
                <input type="file" id="file" onChange={handleMediaChange} multiple />
              </div>
              {previews.length > 0 && (
                <div className="preview">
                  {previews.map((preview, index) => (
                    <div key={index}>
                      {mediaFiles[index].type.startsWith('image/') ? (
                        <img src={preview} alt="Preview" />
                      ) : (
                        <video controls preload="metadata">
                          <source src={preview} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="modal_buttons">
                <button
                  className="add_ad_button"
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : <><FiPlusCircle /> Add</>}
                </button>
                <button className="cancel_ad_button" type="button" onClick={resetForm}>
                  <FiXCircle /> Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ad Cards Container */}
      <div className="ad_container">
        <div className="ad_grid">
          {ads.map((ad) => (
            <div className="card" key={ad.id}>
              <div className="card_content">
                <h3>{ad.name}</h3>
                <div className="card_desc">
                  {/* Ensure mediaData is not undefined */}
                  {(ad.mediaData || []).map((media, index) => (
                    media.img_url ? (
                      <img key={index} src={media.img_url} alt="Advertisement" className="media_preview" />
                    ) : (
                      <video key={index} controls preload="metadata" width="100%" height="200">
                        <source src={media.vid_url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )
                  ))}
                </div>
              </div>
              <button
                className="remove_ad_button"
                onClick={() => handleDelete(ad.id, ad.mediaData || [])} // Handle undefined mediaData
              >
                <FiTrash2 /> Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvertisementManagement;
