// Import the necessary controller
const orderController = require('../Order.controller');

// Step 1: Fetching Transaction Data
async function fetchTransactionData(productId) {
  try {
    // Fetch order history data from the database
    const orderHistory = await orderController.getAllOrdersForML(productId);
    console.log('Fetched transaction data:', orderHistory); // Log fetched transaction data
    return orderHistory;
  } catch (error) {
    console.error('Error fetching transaction data:', error);
    throw error; // Handle error appropriately
  }
}

// Step 2: Preprocessing Transaction Data
function preprocessTransactionData(transactionData) {
  try {
    // Initialize an object to store preprocessed data for each user
    const preprocessedDataByUser = {};

    // Iterate through each transaction data
    transactionData.forEach(transaction => {
      const userId = transaction.user.user_id;
      const products = transaction.order.items.map(item => item.product_id);

      // Check if preprocessed data for this user already exists
      if (!preprocessedDataByUser[userId]) {
        preprocessedDataByUser[userId] = [];
      }

      // Add the products from this transaction to the user's preprocessed data
      preprocessedDataByUser[userId].push(...products);
    });

    return preprocessedDataByUser;
  } catch (error) {
    console.error('Error preprocessing transaction data:', error);
    throw error; // Handle error appropriately
  }
}
//update soon .............

// Function to generate frequent itemsets of length 1 (single items)
function generateFrequentItemsetsOfSizeOne(transactionData, minSupport) {
  const itemCounts = {}; // Object to store item counts
  for (const userProducts of Object.values(transactionData)) {
    for (const product of userProducts) {
      itemCounts[product] = (itemCounts[product] || 0) + 1;
    }
  }
  // Filter items that meet the minimum support threshold
  const frequentItemsets = Object.entries(itemCounts).filter(([product, count]) => count >= minSupport);
  return frequentItemsets.map(([product]) => [parseInt(product)]);
}

// Function to generate candidate itemsets of length k by joining frequent itemsets of length k-1
function generateCandidateItemsets(frequentItemsets) {
  const candidateItemsets = [];
  const k = frequentItemsets[0].length + 1; // Length of the new candidate itemsets
  for (let i = 0; i < frequentItemsets.length; i++) {
    for (let j = i + 1; j < frequentItemsets.length; j++) {
      const itemset1 = frequentItemsets[i];
      const itemset2 = frequentItemsets[j];
      // Check if the first k-2 elements are the same in both itemsets
      if (itemset1.slice(0, k - 2).every((item, index) => item === itemset2[index])) {
        // Join the itemsets to create a candidate itemset
        const candidateItemset = [...itemset1, itemset2[k - 2]];
        candidateItemsets.push(candidateItemset);
      }
    }
  }
  console.log(`Candidate itemsets of length ${k}:`, candidateItemsets); // Log candidate itemsets
  return candidateItemsets;
}

// Function to prune candidate itemsets that do not meet the minimum support threshold
function pruneCandidateItemsets(candidateItemsets, transactionData, minSupport) {
  const itemCounts = {}; // Object to store item counts

  // Check if candidateItemsets is empty or undefined
  if (!candidateItemsets || candidateItemsets.length === 0) {
    console.log("No candidate itemsets to prune");
    return []; // Return an empty array since there are no candidate itemsets
  }

  for (const userProducts of Object.values(transactionData)) {
    for (const candidateItemset of candidateItemsets) {
      const key = candidateItemset.join(','); // Convert array to string
      if (candidateItemset.every(item => userProducts.includes(item))) {
        itemCounts[key] = (itemCounts[key] || 0) + 1;
      }
    }
  }

  console.log("Item counts:", itemCounts); // Log item counts

  // Filter candidate itemsets that meet the minimum support threshold
  const frequentItemsets = Object.entries(itemCounts).filter(([itemset, count]) => count >= minSupport);

  console.log(`Frequent itemsets of length ${candidateItemsets[0] ? candidateItemsets[0].length : 0}:`, frequentItemsets); // Log frequent itemsets

  return frequentItemsets.map(([itemset]) => itemset.split(',').map(Number));
}

// Main function to apply the Apriori algorithm
// function applyAprioriAlgorithm(transactionData, minSupport) {
//   let frequentItemsets = generateFrequentItemsetsOfSizeOne(transactionData, minSupport);
//   let k = 2;
//   while (frequentItemsets.length > 0) {
//     const candidateItemsets = generateCandidateItemsets(frequentItemsets);
//     frequentItemsets = pruneCandidateItemsets(candidateItemsets, transactionData, minSupport);
//     console.log(`Frequent itemsets of length ${k}:`, frequentItemsets);
//     k++;
//   }
//   return frequentItemsets; // Add this line to return frequentItemsets
// }
function applyAprioriAlgorithm(transactionData, minSupport, maxLength) {
    let frequentItemsets = generateFrequentItemsetsOfSizeOne(transactionData, minSupport);
    let k = 2;
    while (frequentItemsets.length > 0 && k <= maxLength) {
      const candidateItemsets = generateCandidateItemsets(frequentItemsets);
      frequentItemsets = pruneCandidateItemsets(candidateItemsets, transactionData, minSupport);
      console.log(`Frequent itemsets of length ${k}:`, frequentItemsets);
      k++;
    }
    return frequentItemsets; // Add this line to return frequentItemsets
  }

// Function to generate association rules from frequent itemsets
// function generateAssociationRules(frequentItemsets, minConfidence) {
//   const associationRules = [];
//   for (let i = 0; i < frequentItemsets.length; i++) {
//     for (let j = 0; j < frequentItemsets.length; j++) {
//       if (i !== j) {
//         const itemsetA = frequentItemsets[i];
//         const itemsetB = frequentItemsets[j];
//         if (itemsetA.length < itemsetB.length && itemsetA.every(item => itemsetB.includes(item))) {
//           // Calculate confidence for the rule itemsetA => itemsetB
//           const supportA = calculateSupport(itemsetA);
//           const supportAB = calculateSupport([...itemsetA, ...itemsetB]);
//           const confidence = supportAB / supportA;
//           if (confidence >= minConfidence) {
//             associationRules.push({ antecedent: itemsetA, consequent: itemsetB, confidence });
//           }
//         }
//       }
//     }
//   }
//   return associationRules;
// }

// Function to calculate support for an itemset
// function calculateSupport(itemset) {
//   const transactionCount = Object.keys(transactionData).length;
//   let supportCount = 0;
//   for (const userProducts of Object.values(transactionData)) {
//     if (itemset.every(item => userProducts.includes(item))) {
//       supportCount++;
//     }
//   }
//   return supportCount / transactionCount;
// }

// Main function to apply the Apriori algorithm and generate association rules
// async function main(productId) {
//   try {
//     // Step 1: Fetch transaction data
//     const transactionData = await fetchTransactionData(productId);

//     // Step 2: Preprocess transaction data
//     const preprocessedData = preprocessTransactionData(transactionData);

//     // Display preprocessed data (for demonstration purposes)
//     console.log('Preprocessed transaction data:');
//     console.log(preprocessedData);

//     // Step 3: Apply the Apriori algorithm
//     const minSupport = 0.1; // Adjust this value as needed
//     const frequentItemsets = applyAprioriAlgorithm(preprocessedData, minSupport);

//     // Step 4: Generate association rules
//     const minConfidence = 0.5; // Adjust this value as needed
//     const associationRules = generateAssociationRules(frequentItemsets, minConfidence);
//     console.log('Generated association rules:');
//     console.log(associationRules);

//     return associationRules; // Return association rules
//   } catch (error) {
//     console.error('An error occurred:', error);
//     throw error;
//   }
// }

// Export the main function
// Main function to apply the Apriori algorithm and generate association rules

// Function to generate association rules from frequent itemsets
function generateAssociationRules(frequentItemsets, minConfidence, transactionData) {
    const associationRules = [];
    const transactionCount = Object.keys(transactionData).length; // Calculate transaction count

    for (let i = 0; i < frequentItemsets.length; i++) {
      for (let j = 0; j < frequentItemsets.length; j++) {
        if (i !== j) {
          const itemsetA = frequentItemsets[i];
          const itemsetB = frequentItemsets[j];
          
          if (isSubset(itemsetA, itemsetB)) {
            // Calculate support for itemsetA U itemsetB
            const supportAB = calculateSupport([...itemsetA, ...itemsetB], transactionData);
            
            // Calculate confidence for the rule itemsetA => itemsetB
            const supportA = calculateSupport(itemsetA, transactionData);
            const confidence = supportAB / supportA;
            
            if (confidence >= minConfidence) {
              associationRules.push({ antecedent: itemsetA, consequent: itemsetB, confidence });
            }
          }
        }
      }
    }
    return associationRules;
  }

  
  // Function to check if one itemset is a subset of another
  function isSubset(itemsetA, itemsetB) {
    return itemsetA.every(item => itemsetB.includes(item));
  }
  
  // Function to calculate support for an itemset
  function calculateSupport(itemset, transactionData) {
    let supportCount = 0;
    for (const userProducts of Object.values(transactionData)) {
      if (itemset.every(item => userProducts.includes(item))) {
        supportCount++;
      }
    }
    return supportCount;
  }

  
async function main(productId) {
    try {
      // Step 1: Fetch transaction data
      const transactionData = await fetchTransactionData(productId);
  
      // Step 2: Preprocess transaction data
      const preprocessedData = preprocessTransactionData(transactionData);
  
      // Display preprocessed data (for demonstration purposes)
      console.log('Preprocessed transaction data:');
      console.log(preprocessedData);
  
      // Step 3: Apply the Apriori algorithm
      const minSupport = 0.1; // Adjust this value as needed
      const frequentItemsets = applyAprioriAlgorithm(preprocessedData, minSupport, 3); // Limit to length 5
  
      // Step 4: Generate association rules
      const minConfidence = 0.1; // Adjust this value as needed
      const associationRules = generateAssociationRules(frequentItemsets, minConfidence, transactionData);

      console.log('Generated association rules:');
      console.log(associationRules);
  
      return associationRules; // Return association rules
    } catch (error) {
      console.error('An error occurred:', error);
      throw error;
    }
  }
module.exports = { main };
