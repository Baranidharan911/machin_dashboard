import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { FiTrash, FiPlus, FiEdit, FiX } from 'react-icons/fi';
import '../styles/NutrientInformation.css';
import 'react-toastify/dist/ReactToastify.css';

const NutrientInformation = () => {
  const [brands, setBrands] = useState([]);  // Initialize as empty array
  const [flavours, setFlavours] = useState([]); // Initialize as empty array
  const [majorNutrients, setMajorNutrients] = useState([]); // Initialize as empty array
  const [minorNutrients, setMinorNutrients] = useState([]); // Initialize as empty array
  const [newRow, setNewRow] = useState({});
  const [originalRow, setOriginalRow] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  const fetchNutrientNames = useCallback(async () => {
    try {
      const nutrientsSnapshot = await getDocs(collection(db, 'NutrientsName'));

      const nutrientsData = nutrientsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const major = nutrientsData.filter((item) => item.type === 'major');
      const minor = nutrientsData.filter((item) => item.type === 'minor');

      setMajorNutrients(major);
      setMinorNutrients(minor);
      toast.success('Nutrient names fetched successfully!');
    } catch (error) {
      toast.error('Error fetching nutrient names');
      console.error('Error fetching nutrient names: ', error);
    }
  }, []);

  useEffect(() => {
    fetchBrandsAndFlavours();
    fetchNutrientNames();
    fetchExistingData();
  }, [fetchNutrientNames]);

  const fetchBrandsAndFlavours = async () => {
    try {
      const brandsSnapshot = await getDocs(collection(db, 'brands'));
      const flavoursSnapshot = await getDocs(collection(db, 'flavors'));

      const brandData = brandsSnapshot.docs.map((brandDoc) => ({
        id: brandDoc.id,
        name: brandDoc.data().name,
      }));

      const flavourData = flavoursSnapshot.docs.map((flavourDoc) => ({
        id: flavourDoc.id,
        name: flavourDoc.data().name,
        brand: flavourDoc.data().brand,
        supplement: flavourDoc.data().supplement,
      }));

      const sortedBrands = brandData.sort((a, b) => a.name.localeCompare(b.name));

      setBrands(sortedBrands);
      setFlavours(flavourData);
      toast.success('Brands and flavours fetched successfully!');
    } catch (error) {
      toast.error('Error fetching brands and flavours');
      console.error('Error fetching brands and flavours: ', error);
    }
  };

  const fetchExistingData = async () => {
    try {
      const nutrientsSnapshot = await getDocs(collection(db, 'nutrients_collection'));

      const existingData = {};
      nutrientsSnapshot.forEach((doc) => {
        const data = doc.data();
        existingData[doc.id] = {
          major: data.majorNutrients || [],
          minor: data.minorNutrients || [],
        };
      });

      setNewRow(existingData);
      setOriginalRow(existingData);
      toast.success('Data loaded successfully');
    } catch (error) {
      toast.error('Error loading existing data');
      console.error('Error loading existing data: ', error);
    }
  };

  const handleAddMajorNutrient = async () => {
    const newNutrient = prompt('Enter the name of the new Major Nutrient:');
    if (newNutrient) {
      try {
        const docRef = doc(collection(db, 'NutrientsName'));
        await setDoc(docRef, { name: newNutrient, type: 'major' });
        setMajorNutrients([...majorNutrients, { id: docRef.id, name: newNutrient }]);

        setNewRow((prevState) => {
          const updatedData = { ...prevState };
          Object.keys(updatedData).forEach((key) => {
            updatedData[key].major.push('');
          });
          return updatedData;
        });
        toast.success('Major nutrient added successfully');
      } catch (error) {
        toast.error('Error adding major nutrient');
        console.error('Error adding major nutrient: ', error);
      }
    }
  };

  const handleAddMinorNutrient = async () => {
    const newNutrient = prompt('Enter the name of the new Minor Nutrient:');
    if (newNutrient) {
      try {
        const docRef = doc(collection(db, 'NutrientsName'));
        await setDoc(docRef, { name: newNutrient, type: 'minor' });
        setMinorNutrients([...minorNutrients, { id: docRef.id, name: newNutrient }]);

        setNewRow((prevState) => {
          const updatedData = { ...prevState };
          Object.keys(updatedData).forEach((key) => {
            updatedData[key].minor.push('');
          });
          return updatedData;
        });
        toast.success('Minor nutrient added successfully');
      } catch (error) {
        toast.error('Error adding minor nutrient');
        console.error('Error adding minor nutrient: ', error);
      }
    }
  };

  const handleMajorNutrientChange = (flavourId, index, value) => {
    setNewRow((prevState) => ({
      ...prevState,
      [flavourId]: {
        ...prevState[flavourId],
        major: prevState[flavourId]?.major
          ? prevState[flavourId].major.map((item, i) => (i === index ? value : item))
          : Array(majorNutrients.length).fill(''),  // Initialize if undefined
      },
    }));
  };

  const handleMinorNutrientChange = (flavourId, index, value) => {
    setNewRow((prevState) => ({
      ...prevState,
      [flavourId]: {
        ...prevState[flavourId],
        minor: prevState[flavourId]?.minor
          ? prevState[flavourId].minor.map((item, i) => (i === index ? value : item))
          : Array(minorNutrients.length).fill(''),  // Initialize if undefined
      },
    }));
  };

  const handleDeleteMajorNutrient = async (index, id) => {
    try {
      await deleteDoc(doc(db, 'NutrientsName', id));
      setMajorNutrients(majorNutrients.filter((_, i) => i !== index));

      setNewRow((prevState) => {
        const updatedData = { ...prevState };
        Object.keys(updatedData).forEach((key) => {
          updatedData[key].major = updatedData[key]?.major.filter((_, i) => i !== index);
        });
        return updatedData;
      });
      toast.success('Major nutrient deleted successfully');
    } catch (error) {
      toast.error('Error deleting major nutrient');
      console.error('Error deleting major nutrient: ', error);
    }
  };

  const handleDeleteMinorNutrient = async (index, id) => {
    try {
      await deleteDoc(doc(db, 'NutrientsName', id));
      setMinorNutrients(minorNutrients.filter((_, i) => i !== index));

      setNewRow((prevState) => {
        const updatedData = { ...prevState };
        Object.keys(updatedData).forEach((key) => {
          updatedData[key].minor = updatedData[key]?.minor.filter((_, i) => i !== index);
        });
        return updatedData;
      });
      toast.success('Minor nutrient deleted successfully');
    } catch (error) {
      toast.error('Error deleting minor nutrient');
      console.error('Error deleting minor nutrient: ', error);
    }
  };

  const toggleEditMode = () => {
    setOriginalRow(newRow);
    setIsEditing(!isEditing);
  };

  const handleCancelEdit = () => {
    setNewRow(originalRow);
    setIsEditing(false);
    toast.info('Edit canceled');
  };

  const handleSaveAll = async () => {
    try {
      const flavourCollection = collection(db, 'nutrients_collection');

      for (const flavourId in newRow) {
        const flavour = flavours.find((f) => f.id === flavourId);
        const docRef = doc(flavourCollection, flavourId);

        await setDoc(
          docRef,
          {
            brand: flavour.brand,
            flavour: flavour.name,
            supplement: flavour.supplement,
            majorNutrients: newRow[flavourId].major,
            minorNutrients: newRow[flavourId].minor,
          },
          { merge: true }
        );
      }

      toast.success('Data saved successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Error saving data');
      console.error('Error saving data:', error);
    }
  };

  return (
    <div className='table_wrapper'>
      <h2>Nutrient Information</h2>

      <table className='nutrient-table'>
        <thead>
          <tr>
            <th colSpan='3'>Nutrient Information</th>
            <th colSpan={majorNutrients?.length || 1}>
              Major Nutrients <FiPlus onClick={handleAddMajorNutrient} style={{ cursor: 'pointer' }} />
            </th>
            <th colSpan={minorNutrients?.length || 1}>
              Minor Nutrients <FiPlus onClick={handleAddMinorNutrient} style={{ cursor: 'pointer' }} />
            </th>
          </tr>
          <tr>
            <th>Brand</th>
            <th>Flavour</th>
            <th>Supplement</th>

            {/* Major Nutrient Columns */}
            {majorNutrients?.length > 0 ? majorNutrients.map((nutrient, index) => (
              <th key={index}>
                {nutrient.name}{' '}
                <FiTrash
                  onClick={() => handleDeleteMajorNutrient(index, nutrient.id)}
                  style={{ cursor: 'pointer' }}
                />
              </th>
            )) : <th>No major nutrients</th>}

            {/* Minor Nutrient Columns */}
            {minorNutrients?.length > 0 ? minorNutrients.map((nutrient, index) => (
              <th key={index}>
                {nutrient.name}{' '}
                <FiTrash
                  onClick={() => handleDeleteMinorNutrient(index, nutrient.id)}
                  style={{ cursor: 'pointer' }}
                />
              </th>
            )) : <th>No minor nutrients</th>}
          </tr>
        </thead>
        <tbody>
          {brands?.length > 0 ? brands.map((brand) => {
            let brandFlavours = flavours?.filter((flavour) => flavour.brand === brand.name);

            return (
              <>
                {brandFlavours?.map((flavour, index) => (
                  <tr key={flavour.id}>
                    {index === 0 && <td rowSpan={brandFlavours.length}>{brand.name}</td>}
                    <td>{flavour.name}</td>
                    <td>{flavour.supplement}</td>

                    {/* Inputs for Major Nutrients */}
                    {majorNutrients?.length > 0 ? majorNutrients.map((nutrient, i) => (
                      <td key={i}>
                        <input
                          type='number'
                          value={newRow[flavour.id]?.major?.[i] || ''}
                          onChange={(e) => handleMajorNutrientChange(flavour.id, i, e.target.value)}
                          disabled={!isEditing}
                        />
                      </td>
                    )) : <td></td>}

                    {/* Inputs for Minor Nutrients */}
                    {minorNutrients?.length > 0 ? minorNutrients.map((nutrient, i) => (
                      <td key={i}>
                        <input
                          type='number'
                          value={newRow[flavour.id]?.minor?.[i] || ''}
                          onChange={(e) => handleMinorNutrientChange(flavour.id, i, e.target.value)}
                          disabled={!isEditing}
                        />
                      </td>
                    )) : <td></td>}
                  </tr>
                ))}
              </>
            );
          }) : <tr><td colSpan="5">No brands available</td></tr>}
        </tbody>
      </table>

      <div className='table-actions'>
        {isEditing ? (
          <>
            <button className='save-all-btn' onClick={handleSaveAll}>
              Save All
            </button>
            <button className='cancel-btn' onClick={handleCancelEdit}>
              <FiX /> Cancel
            </button>
          </>
        ) : (
          <button className='edit-all-btn' onClick={toggleEditMode}>
            <FiEdit /> Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default NutrientInformation;
