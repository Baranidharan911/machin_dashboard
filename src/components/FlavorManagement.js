import React, { useState, useEffect } from 'react';
import { GrPowerReset, GrEdit, GrTrash, GrCheckmark, GrClose, GrAdd } from 'react-icons/gr';
import { IoMdSend } from 'react-icons/io';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/FlavorManagement.css';

const FlavorManagement = () => {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [flavorName, setFlavorName] = useState('');
  const [supplementType, setSupplementType] = useState('');
  const [mlContent, setMlContent] = useState('');
  const [flavorImage, setFlavorImage] = useState(null);
  const [flavorList, setFlavorList] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingFlavorId, setEditingFlavorId] = useState(null);
  const [brands, setBrands] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  useEffect(() => {
    fetchBrands();
    fetchFlavors();
  }, []);

  const fetchBrands = async () => {
    const querySnapshot = await getDocs(collection(db, 'brands'));
    const brandList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setBrands(brandList);
  };

  const fetchFlavors = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'flavors'));
      const flavorList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFlavorList(flavorList);
    } catch (error) {
      console.error("Error fetching flavors: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFlavor = async () => {
    if (!selectedBrand || !flavorName || !supplementType || !mlContent) {
      alert('Please fill in all fields');
      return;
    }

    let imageUrl = imagePreview;

    if (removeExistingImage && imagePreview) {
      const imageRef = ref(storage, imagePreview);
      await deleteObject(imageRef);
      imageUrl = '';
    }

    if (flavorImage) {
      const storageRef = ref(storage, `flavors/${flavorImage.name}`);
      await uploadBytes(storageRef, flavorImage);
      imageUrl = await getDownloadURL(storageRef);
    }

    const newFlavor = {
      brand: selectedBrand,
      name: flavorName,
      supplement: supplementType,
      ml: mlContent,
      imageUrl: imageUrl || '',
    };

    try {
      if (editingFlavorId) {
        const flavorDoc = doc(db, 'flavors', editingFlavorId);
        await updateDoc(flavorDoc, newFlavor);
        setFlavorList(flavorList.map(flavor => flavor.id === editingFlavorId ? { id: editingFlavorId, ...newFlavor } : flavor));
        toast.success('Flavor updated successfully!');
      } else {
        const docRef = await addDoc(collection(db, 'flavors'), newFlavor);
        setFlavorList([...flavorList, { id: docRef.id, ...newFlavor }]);
        toast.success('Flavor added successfully!');
      }

      handleReset();
      setShowForm(false);
    } catch (error) {
      console.error("Error adding flavor: ", error);
      toast.error("Failed to add flavor. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    try {
      const flavorToDelete = flavorList.find(flavor => flavor.id === id);
      await deleteDoc(doc(db, 'flavors', id));
      if (flavorToDelete.imageUrl) {
        const imageRef = ref(storage, flavorToDelete.imageUrl);
        await deleteObject(imageRef);
      }
      setFlavorList(flavorList.filter(flavor => flavor.id !== id));
      toast.success('Flavor deleted successfully!');
    } catch (error) {
      console.error("Error deleting flavor: ", error);
      toast.error("Failed to delete flavor. Please try again.");
    }
  };

  const handleReset = () => {
    setSelectedBrand('');
    setFlavorName('');
    setSupplementType('');
    setMlContent('');
    setFlavorImage(null);
    setImagePreview(null);
    setEditingFlavorId(null);
    setRemoveExistingImage(false);
  };

  const handleEdit = (flavor) => {
    setSelectedBrand(flavor.brand);
    setFlavorName(flavor.name);
    setSupplementType(flavor.supplement);
    setMlContent(flavor.ml);
    setImagePreview(flavor.imageUrl);
    setEditingFlavorId(flavor.id);
    setRemoveExistingImage(false);
    setShowForm(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setFlavorImage(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveExistingImage(false);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFlavorImage(null);
    setRemoveExistingImage(true);
  };

  const handleAddNewFlavor = () => {
    handleReset();
    setShowForm(true);
  };

  const handleSupplementTypeChange = (e) => {
    const selectedType = e.target.value;
    setSupplementType(selectedType);

    // Reset mlContent when supplement type changes
    setMlContent('');
  };

  const groupedFlavors = flavorList.reduce((groups, flavor) => {
    const brand = flavor.brand;
    if (!groups[brand]) {
      groups[brand] = [];
    }
    groups[brand].push(flavor);
    return groups;
  }, {});

  const sortedBrandKeys = Object.keys(groupedFlavors).sort();

  return (
    <div className="flavor_management_container">
      <ToastContainer />
      {showForm && (
        <div className="form_modal">
          <div className="form_card">
            <h2>{editingFlavorId ? 'Edit Flavor' : 'Add New Flavor'}</h2>
            <div className="form_group">
              <label htmlFor="brand">Select Brand:</label>
              <select id="brand" value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="animated_dropdown">
                <option value="">--Select Brand--</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.name}>{brand.name}</option>
                ))}
              </select>
            </div>
            <div className="form_group">
              <label htmlFor="flavorName">Flavor Name:</label>
              <input
                type="text"
                id="flavorName"
                value={flavorName}
                onChange={(e) => setFlavorName(e.target.value)}
                className="animated_input"
              />
            </div>
            <div className="form_group">
              <label>Supplement Type:</label>
              <div className="radio_group">
                <label className="animated_radio">
                  <input
                    type="radio"
                    value="Whey"
                    checked={supplementType === 'Whey'}
                    onChange={handleSupplementTypeChange}
                  />
                  Whey
                </label>
                <label className="animated_radio">
                  <input
                    type="radio"
                    value="Mass Gainer"
                    checked={supplementType === 'Mass Gainer'}
                    onChange={handleSupplementTypeChange}
                  />
                  Mass Gainer
                </label>
              </div>
            </div>
            <div className="form_group">
              <label>ML Content:</label>
              <div className="radio_group">
                {supplementType === 'Whey' && (
                  <>
                    <label className="animated_radio">
                      <input
                        type="radio"
                        value="200ml"
                        checked={mlContent === '200ml'}
                        onChange={(e) => setMlContent(e.target.value)}
                      />
                      200ml
                    </label>
                    <label className="animated_radio">
                      <input
                        type="radio"
                        value="400ml"
                        checked={mlContent === '400ml'}
                        onChange={(e) => setMlContent(e.target.value)}
                      />
                      400ml
                    </label>
                  </>
                )}
                {supplementType === 'Mass Gainer' && (
                  <label className="animated_radio">
                    <input
                      type="radio"
                      value="200ml"
                      checked={mlContent === '200ml'}
                      onChange={(e) => setMlContent(e.target.value)}
                    />
                    200ml
                  </label>
                )}
              </div>
            </div>
            <div className="form_group">
              <label htmlFor="flavorImage">Add Flavor Image:</label>
              {!imagePreview && (
                <input
                  type="file"
                  id="flavorImage"
                  onChange={handleImageChange}
                  className="animated_input"
                />
              )}
              {imagePreview && (
                <div className="image_preview_container">
                  <img src={imagePreview} alt="Preview" className="image_preview" />
                  <AiOutlineCloseCircle 
                    className="remove_image_icon"
                    onClick={handleRemoveImage} 
                  />
                </div>
              )}
            </div>
            <div className="button_group">
              {!editingFlavorId && (
                <button className="reset_button" onClick={handleReset}>
                  <GrPowerReset /> Reset
                </button>
              )}
              <button className="add_button" onClick={handleAddFlavor}>
                {editingFlavorId ? <GrCheckmark /> : <IoMdSend />} {editingFlavorId ? 'Update Flavor' : 'Add Flavor'}
              </button>
              <button className="cancel_button" onClick={() => setShowForm(false)}>
                <GrClose /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flavor_list_card">
        {loading ? (
          <div className="loader"></div>  
        ) : (
          <>
            <div className="flavor_list_header">
              <h2>Flavors Management</h2>
              <button className="add_flavor_button" onClick={handleAddNewFlavor}>
                <GrAdd /> Add Flavor
              </button>
            </div>
            <div className="brand_containers">
              {sortedBrandKeys.map((brand, index) => (
                <div key={index} className="brand_container">
                  <h3>{brand}</h3>
                  <div className="flavor_list">
                    {groupedFlavors[brand].map(flavor => (
                      <div key={flavor.id} className="flavor_card">
                        <img src={flavor.imageUrl} alt={flavor.name} className="flavor_image" />
                        <p><strong>Flavor:</strong> {flavor.name}</p>
                        <p><strong>Type:</strong> {flavor.supplement}</p>
                        <p><strong>ML:</strong> {flavor.ml}</p>
                        <div className="flavor_buttons">
                          <button className="edit_button" onClick={() => handleEdit(flavor)}>
                            <GrEdit />
                          </button>
                          <button className="delete_button" onClick={() => handleDelete(flavor.id)}>
                            <GrTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FlavorManagement;
