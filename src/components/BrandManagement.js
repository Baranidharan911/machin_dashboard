import React, { useState, useEffect } from 'react';
import { FaEdit } from 'react-icons/fa';
import { GrAdd } from 'react-icons/gr';
import { MdDelete } from 'react-icons/md';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import Header from './Header';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/BrandManagement.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const BrandManagement = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [brandImage, setBrandImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingBrandId, setEditingBrandId] = useState(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'brands'));
        const brandsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        brandsData.sort((a, b) => a.name.localeCompare(b.name));

        setBrands(brandsData);
      } catch (error) {
        console.error("Error fetching brands: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  const handleAddOrUpdateBrand = async () => {
    if (!brandName) {
      toast.error("Please provide a brand name.");
      return;
    }
  
    try {
      let imageUrl = imagePreview; // Keep the existing image URL by default

      if (removeExistingImage) {
        // If the user removed the existing image
        if (imagePreview) {
          const imageRef = ref(storage, imagePreview); // Use the preview URL to reference the storage location
          await deleteObject(imageRef);
        }
        imageUrl = ''; // Clear the image URL since it was removed
      }

      if (brandImage) {
        // If a new image is provided, upload it
        const storageRef = ref(storage, `brands/${brandImage.name}`);
        await uploadBytes(storageRef, brandImage);
        imageUrl = await getDownloadURL(storageRef);
      }
  
      const brandData = {
        name: brandName,
        image: imageUrl,
      };
  
      if (editingBrandId) {
        const brandRef = doc(db, 'brands', editingBrandId);
        const oldBrandData = brands.find(brand => brand.id === editingBrandId);
  
        // Update the brand
        await updateDoc(brandRef, brandData);
  
        // Update the flavors with the new brand name
        const flavorQuerySnapshot = await getDocs(query(collection(db, 'flavors'), where('brand', '==', oldBrandData.name)));
        flavorQuerySnapshot.forEach(async (flavorDoc) => {
          await updateDoc(doc(db, 'flavors', flavorDoc.id), { brand: brandName });
        });
  
        setBrands(brands.map(brand => brand.id === editingBrandId ? { ...brand, ...brandData } : brand));
        toast.info("Brand updated successfully!");
      } else {
        const docRef = await addDoc(collection(db, 'brands'), brandData);
        setBrands([...brands, { ...brandData, id: docRef.id }]);
        toast.success("New brand added successfully!");
      }
  
      handleReset();
      setShowForm(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to add/update brand. Please try again.");
    }
  };

  const handleRemove = async (id) => {
    try {
      const brandToDelete = brands.find(brand => brand.id === id);
      await deleteDoc(doc(db, 'brands', id));
      
      const flavorQuerySnapshot = await getDocs(query(collection(db, 'flavors'), where('brand', '==', brandToDelete.name)));
      flavorQuerySnapshot.forEach(async (flavorDoc) => {
        await deleteDoc(doc(db, 'flavors', flavorDoc.id));
      });

      if (brandToDelete.image) {
        const imageRef = ref(storage, brandToDelete.image);
        await deleteObject(imageRef);
      }
      
      const updatedBrands = brands.filter(brand => brand.id !== id);
      updatedBrands.sort((a, b) => a.name.localeCompare(b.name));
      setBrands(updatedBrands);
      
      toast.success("Brand and its associated flavors deleted successfully!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete brand. Please try again.");
    }
  };

  const handleEdit = (brand) => {
    setBrandName(brand.name);
    setBrandImage(null);
    setImagePreview(brand.image);
    setEditingBrandId(brand.id);
    setRemoveExistingImage(false);
    setShowForm(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setBrandImage(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveExistingImage(false); 
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setBrandImage(null); 
    setRemoveExistingImage(true);
    const brandImageInput = document.getElementById('brandImage');
    if (brandImageInput) {
        brandImageInput.value = null;
    }
  };

  const handleReset = () => {
    setBrandName('');
    setBrandImage(null);
    setImagePreview(null);
    setEditingBrandId(null);
    setRemoveExistingImage(false);
    const brandImageInput = document.getElementById('brandImage');
    if (brandImageInput) {
        brandImageInput.value = null;
    }
  };

  const handleAddNewBrand = () => {
    setShowForm(true);
    handleReset();
  };

  const chartData = {
    pie: {
      labels: ['Brand A', 'Brand B', 'Brand C', 'Brand D'],
      datasets: [{
        data: [300, 50, 100, 150],
        backgroundColor: ['#1F77B4', '#FF7F0E', '#2CA02C', '#D62728'],
        hoverBackgroundColor: ['#1A5F9A', '#CC6600', '#238823', '#AA2222']
      }]
    },
    bar: {
      labels: ['Brand A', 'Brand B', 'Brand C', 'Brand D'],
      datasets: [{
        label: 'Revenue',
        data: [12000, 19000, 3000, 5000],
        backgroundColor: ['#17BECF', '#9467BD', '#8C564B', '#E377C2'],
        borderColor: ['#1496A3', '#785194', '#6F4539', '#B85A9F'],
        borderWidth: 1
      }]
    },
    donut: {
      labels: ['Brand A', 'Brand B', 'Brand C', 'Brand D'],
      datasets: [{
        data: [250, 150, 100, 200],
        backgroundColor: ['#BCBD22', '#7F7F7F', '#17BECF', '#AEC7E8'],
        hoverBackgroundColor: ['#989A1D', '#656565', '#139099', '#8BA4C0']
      }]
    }
  };

  return (
    <div className="brand_management_container">
      <Header />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Brand Management</h2>
        <button 
          className="add_brand_button" 
          onClick={handleAddNewBrand}
          disabled={brands.length >= 3}
        >
          <GrAdd /> Add New Brand
        </button>
      </div>
      <ToastContainer />
      
      {showForm && (
        <div className="form_modal">
          <div className="form_card">
            <h2>{editingBrandId ? 'Edit Brand' : 'Add New Brand'}</h2>
            <div className="form_group">
              <label htmlFor="brandName">Brand Name:</label>
              <input
                type="text"
                id="brandName"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="animated_input"
              />
            </div>
            <div className="form_group">
              <label htmlFor="brandImage">Brand Image:</label>
              <input
                type="file"
                id="brandImage"
                onChange={handleImageChange}
                className="animated_input"
              />
              {imagePreview && (
                <div style={{ position: 'relative' }}>
                  <img src={imagePreview} alt="Preview" className="image_preview" />
                  <AiOutlineCloseCircle 
                    className="remove_image_icon" 
                    onClick={handleRemoveImage} 
                    style={{ position: 'absolute', top: 0, right: 0, cursor: 'pointer', fontSize: '24px', color: '#f44336' }}
                  />
                </div>
              )}
            </div>
            <div className="button_group">
              <button className="reset_button" onClick={handleReset}>
                Reset
              </button>
              <button className="add_button" onClick={handleAddOrUpdateBrand}>
                {editingBrandId ? 'Update Brand' : 'Add Brand'}
              </button>
              <button className="cancel_button" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="brand_section">
        <div className="brand_logo_container">
          {loading ? (
            <div className="loader"></div>
          ) : (
            brands.map((brand) => (
              <div key={brand.id} className="brand_card">
                <img src={brand.image} alt={brand.name} className="brand_logo" />
                <p>{brand.name}</p>
                <div className="icon_container">
                  <FaEdit className="icon edit_icon" onClick={() => handleEdit(brand)} />
                  <MdDelete className="icon delete_icon" onClick={() => handleRemove(brand.id)} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="charts_section">
        <div className="chart_container_unique">
          <h3>Brand-wise Sales Analytics</h3>
          <Pie data={chartData.pie} />
        </div>
        <div className="chart_container_unique">
          <h3>Revenue Per Brand</h3>
          <Bar data={chartData.bar} />
        </div>
        <div className="chart_container_unique">
          <h3>Most Popular Brands</h3>
          <Doughnut data={chartData.donut} />
        </div>
      </div>
    </div>
  );
};

export default BrandManagement;
