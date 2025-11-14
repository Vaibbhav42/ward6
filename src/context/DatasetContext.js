import React, { createContext, useContext, useState } from 'react';
import { VOTER_DATASETS, DATASET_NAMES } from '../data/voters';

const DatasetContext = createContext();

export const useDataset = () => {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error('useDataset must be used within a DatasetProvider');
  }
  return context;
};

export const DatasetProvider = ({ children }) => {
  const [selectedDataset, setSelectedDataset] = useState(101);

  const changeDataset = (datasetId) => {
    setSelectedDataset(datasetId);
  };

  const getCurrentVoters = () => {
    return VOTER_DATASETS[selectedDataset] || VOTER_DATASETS[101];
  };

  const getCurrentDatasetName = () => {
    return DATASET_NAMES[selectedDataset] || DATASET_NAMES[101];
  };

  const value = {
    selectedDataset,
    setSelectedDataset: changeDataset,
    getCurrentVoters,
    getCurrentDatasetName,
    allDatasets: VOTER_DATASETS,
    datasetNames: DATASET_NAMES,
  };

  return (
    <DatasetContext.Provider value={value}>
      {children}
    </DatasetContext.Provider>
  );
};

export default DatasetContext;