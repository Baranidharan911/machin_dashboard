import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, updateDoc, doc, getDocs } from 'firebase/firestore';
import { FiSave, FiEdit, FiX } from 'react-icons/fi'; // Importing Icons from react-icons
import '../styles/PricingWeightManagement.css';

const PricingWeightManagement = () => {
  const [flavors, setFlavors] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editMode, setEditMode] = useState(false); // Store edit mode for the entire table
  const [rowData, setRowData] = useState({}); // Store the current state for all rows

  useEffect(() => {
    const fetchFlavorsAndBrands = async () => {
      const brandsSnapshot = await getDocs(collection(db, 'brands'));
      const flavorsSnapshot = await getDocs(collection(db, 'flavors'));

      const brandData = brandsSnapshot.docs
        .map(brandDoc => ({
          id: brandDoc.id,
          name: brandDoc.data().name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)); // Sort brands alphabetically

      const flavorData = flavorsSnapshot.docs
        .map(flavorDoc => ({
          id: flavorDoc.id,
          name: flavorDoc.data().name,
          brand: flavorDoc.data().brand,
          supplement: flavorDoc.data().supplement, // Supplement type (Mass Gainer or Whey)
          pricing: flavorDoc.data().pricing || {}, // Fetch existing pricing if available
        }))
        .sort((a, b) => a.name.localeCompare(b.name)); // Sort flavors alphabetically

      setBrands(brandData);
      setFlavors(flavorData);

      // Populate the rowData state with the initial data from Firebase
      const initialRowData = {};
      flavorData.forEach(flavor => {
        initialRowData[flavor.id] = {
          servingSize: '200ml', // Default value, can be changed by user
          price: flavor.pricing['200ml']?.price || '',
          weight: flavor.pricing['200ml']?.weight || '',
        };
      });
      setRowData(initialRowData);
    };

    fetchFlavorsAndBrands();
  }, []);

  const handleServingSizeChange = (e, flavorId) => {
    const servingSize = e.target.value;
    setRowData({
      ...rowData,
      [flavorId]: {
        ...rowData[flavorId],
        servingSize,
      },
    });
  };

  const handleInputChange = (e, flavorId, field) => {
    const value = e.target.value;
    setRowData({
      ...rowData,
      [flavorId]: {
        ...rowData[flavorId],
        [field]: value,
      },
    });
  };

  // Handle saving the entire table (all rows) to Firebase
  const handleSaveAll = async () => {
    setLoading(true);
    try {
      // Loop through the current rowData and update each row in Firebase
      const savePromises = Object.keys(rowData).map(async (flavorId) => {
        const { servingSize, price, weight } = rowData[flavorId];

        const flavorDoc = doc(db, 'flavors', flavorId);
        await updateDoc(flavorDoc, {
          [`pricing.${servingSize}.price`]: price,
          [`pricing.${servingSize}.weight`]: weight,
        });
      });

      await Promise.all(savePromises);
      setMessage('All data in the table has been saved to Firebase successfully!');
    } catch (e) {
      console.error('Error saving data: ', e);
      setMessage('Failed to save data. Please try again.');
    } finally {
      setLoading(false);
      setEditMode(false); // Exit edit mode after saving
    }
  };

  // Handle cancel edit, reset all changes, and exit edit mode
  const handleCancelEdit = () => {
    setEditMode(false); // Exit edit mode without saving
    setRowData({}); // Reset rowData
  };

  // Handle edit mode activation for the entire table
  const handleEditTable = () => {
    setEditMode(true); // Enter edit mode for all rows
  };

  return (
    <div className="table_wrapper">
      <h2>Pricing and Weight Management</h2>

      <table className="pricing-table">
        <thead>
          <tr>
            <th>Brand</th>
            <th>Flavour</th>
            <th>Supplement</th>
            <th>ML</th> {/* Add ML column */}
            <th>Price(₹)</th>
            <th>Weight (g)</th>
          </tr>
        </thead>
        <tbody>
          {brands.map((brand) => {
            // Filter flavors by brand and sort them alphabetically by name
            const brandFlavors = flavors
              .filter((flavor) => flavor.brand === brand.name)
              .sort((a, b) => a.name.localeCompare(b.name)); // Sort flavors alphabetically

            return (
              <>
                {brandFlavors.map((flavor, index) => (
                  <tr key={flavor.id}>
                    {index === 0 && <td rowSpan={brandFlavors.length}>{brand.name}</td>}
                    <td>{flavor.name}</td>
                    <td>{flavor.supplement}</td>

                    {/* ML (Serving Size) Dropdown based on Supplement type */}
                    <td>
                      <select
                        value={rowData[flavor.id]?.servingSize || '200ml'} // Default to '200ml' if not selected
                        onChange={(e) => handleServingSizeChange(e, flavor.id)}
                        disabled={!editMode} // Disable if not in edit mode
                      >
                        {/* If supplement type is "Mass Gainer", show only 200ml */}
                        {flavor.supplement === 'Mass Gainer' ? (
                          <option value="200ml">200ml</option>
                        ) : (
                          // If supplement type is "Whey", show both 200ml and 400ml
                          <>
                            <option value="200ml">200ml</option>
                            <option value="400ml">400ml</option>
                          </>
                        )}
                      </select>
                    </td>

                    {/* Price input for the selected serving size */}
                    <td>
                      <input
                        type="text"
                        value={rowData[flavor.id]?.price || ''} // Controlled input to reflect current rowData state
                        onChange={(e) => handleInputChange(e, flavor.id, 'price')}
                        disabled={!editMode} // Disable if not in edit mode
                      />
                    </td>

                    {/* Weight input for the selected serving size */}
                    <td>
                      <input
                        type="text"
                        value={rowData[flavor.id]?.weight || ''} // Controlled input to reflect current rowData state
                        onChange={(e) => handleInputChange(e, flavor.id, 'weight')}
                        disabled={!editMode} // Disable if not in edit mode
                      />
                    </td>
                  </tr>
                ))}
              </>
            );
          })}
        </tbody>
      </table>

      {/* Common Edit, Save All, and Cancel buttons */}
      {!editMode ? (
        <button onClick={handleEditTable} className="edit-btn">
          <FiEdit /> Edit
        </button>
      ) : (
        <>
          <button onClick={handleSaveAll} className="save-all-btn">
            <FiSave /> Save All
          </button>
          <button onClick={handleCancelEdit} className="cancel-btn">
            <FiX /> Cancel
          </button>
        </>
      )}

      {loading && <p>Updating...</p>}
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default PricingWeightManagement;
