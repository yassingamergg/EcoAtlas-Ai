import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, PieChart } from 'react-native-chart-kit';

const { width: screenWidth } = Dimensions.get('window');

const MobileCarbonCalculator = () => {
  const [entries, setEntries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [inputUnit, setInputUnit] = useState('');
  const [description, setDescription] = useState('');

  // Carbon emission factors (kg CO2 per unit)
  const emissionFactors = {
    electricity: 0.4, // per kWh
    gas: 0.2, // per kWh
    car: 0.12, // per km
    flight: 0.25, // per km
    train: 0.04, // per km
    bus: 0.08, // per km
    food: 2.5, // per kg
    water: 0.0003, // per liter
    waste: 0.5, // per kg
  };

  const categories = [
    { id: 'electricity', name: 'Electricity', icon: 'flash', color: '#f59e0b', unit: 'kWh' },
    { id: 'gas', name: 'Natural Gas', icon: 'flame', color: '#ef4444', unit: 'kWh' },
    { id: 'car', name: 'Car Travel', icon: 'car', color: '#3b82f6', unit: 'km' },
    { id: 'flight', name: 'Flight', icon: 'airplane', color: '#8b5cf6', unit: 'km' },
    { id: 'train', name: 'Train', icon: 'train', color: '#22c55e', unit: 'km' },
    { id: 'bus', name: 'Bus', icon: 'bus', color: '#06b6d4', unit: 'km' },
    { id: 'food', name: 'Food', icon: 'restaurant', color: '#f97316', unit: 'kg' },
    { id: 'water', name: 'Water', icon: 'water', color: '#0ea5e9', unit: 'L' },
    { id: 'waste', name: 'Waste', icon: 'trash', color: '#6b7280', unit: 'kg' },
  ];

  const calculateEmissions = (category, value) => {
    const factor = emissionFactors[category] || 0;
    return value * factor;
  };

  const addEntry = () => {
    if (!selectedCategory || !inputValue || isNaN(parseFloat(inputValue))) {
      Alert.alert('Error', 'Please fill in all fields with valid values');
      return;
    }

    const value = parseFloat(inputValue);
    const emissions = calculateEmissions(selectedCategory, value);
    const category = categories.find(cat => cat.id === selectedCategory);

    const newEntry = {
      id: Date.now().toString(),
      category: selectedCategory,
      categoryName: category.name,
      value: value,
      unit: inputUnit || category.unit,
      emissions: emissions,
      description: description,
      date: new Date().toISOString(),
      color: category.color,
    };

    setEntries(prev => [newEntry, ...prev]);
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedCategory('');
    setInputValue('');
    setInputUnit('');
    setDescription('');
  };

  const deleteEntry = (id) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          setEntries(prev => prev.filter(entry => entry.id !== id));
        }},
      ]
    );
  };

  const getTotalEmissions = () => {
    return entries.reduce((total, entry) => total + entry.emissions, 0);
  };

  const getCategoryTotals = () => {
    const totals = {};
    entries.forEach(entry => {
      if (!totals[entry.category]) {
        totals[entry.category] = {
          name: entry.categoryName,
          emissions: 0,
          color: entry.color,
        };
      }
      totals[entry.category].emissions += entry.emissions;
    });
    return Object.values(totals);
  };

  const renderCategorySelector = () => (
    <View style={styles.categoryGrid}>
      {categories.map(category => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryButton,
            selectedCategory === category.id && styles.categoryButtonActive,
            { borderColor: category.color },
          ]}
          onPress={() => {
            setSelectedCategory(category.id);
            setInputUnit(category.unit);
          }}
        >
          <Ionicons
            name={category.icon}
            size={24}
            color={selectedCategory === category.id ? '#ffffff' : category.color}
          />
          <Text style={[
            styles.categoryButtonText,
            selectedCategory === category.id && styles.categoryButtonTextActive,
          ]}>
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderChart = () => {
    const categoryTotals = getCategoryTotals();
    if (categoryTotals.length === 0) return null;

    const chartData = categoryTotals.map(category => ({
      name: category.name,
      population: category.emissions,
      color: category.color,
      legendFontColor: '#374151',
      legendFontSize: 12,
    }));

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Emissions by Category</Text>
        <PieChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>
    );
  };

  const renderBarChart = () => {
    const categoryTotals = getCategoryTotals();
    if (categoryTotals.length === 0) return null;

    const chartData = {
      labels: categoryTotals.map(cat => cat.name.substring(0, 6)),
      datasets: [{
        data: categoryTotals.map(cat => cat.emissions),
      }],
    };

    const chartConfig = {
      backgroundColor: '#ffffff',
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      decimalPlaces: 1,
      color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      style: {
        borderRadius: 16,
      },
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Emissions Comparison</Text>
        <BarChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
        />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Total Emissions Card */}
        <View style={styles.totalCard}>
          <View style={styles.totalHeader}>
            <Ionicons name="leaf" size={32} color="#22c55e" />
            <Text style={styles.totalTitle}>Total Carbon Footprint</Text>
          </View>
          <Text style={styles.totalValue}>
            {getTotalEmissions().toFixed(2)} kg CO₂
          </Text>
          <Text style={styles.totalSubtext}>
            {entries.length} entries recorded
          </Text>
        </View>

        {/* Charts */}
        {entries.length > 0 && (
          <>
            {renderChart()}
            {renderBarChart()}
          </>
        )}

        {/* Entries List */}
        <View style={styles.entriesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Entries</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowModal(true)}
            >
              <Ionicons name="add" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calculator" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No entries yet</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to add your first carbon footprint entry
              </Text>
            </View>
          ) : (
            entries.map(entry => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryCategory}>
                    <View style={[styles.categoryDot, { backgroundColor: entry.color }]} />
                    <Text style={styles.entryCategoryName}>{entry.categoryName}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteEntry(entry.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.entryDetails}>
                  <Text style={styles.entryValue}>
                    {entry.value} {entry.unit}
                  </Text>
                  <Text style={styles.entryEmissions}>
                    {entry.emissions.toFixed(2)} kg CO₂
                  </Text>
                </View>
                
                {entry.description && (
                  <Text style={styles.entryDescription}>{entry.description}</Text>
                )}
                
                <Text style={styles.entryDate}>
                  {new Date(entry.date).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Entry Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Carbon Entry</Text>
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Category</Text>
            {renderCategorySelector()}

            <Text style={styles.inputLabel}>Value</Text>
            <TextInput
              style={styles.textInput}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Enter amount"
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Unit</Text>
            <TextInput
              style={styles.textInput}
              value={inputUnit}
              onChangeText={setInputUnit}
              placeholder="Enter unit (optional)"
            />

            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add a description..."
              multiline
              numberOfLines={3}
            />

            {selectedCategory && inputValue && (
              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>Preview</Text>
                <Text style={styles.previewText}>
                  {parseFloat(inputValue)} {inputUnit} of {categories.find(cat => cat.id === selectedCategory)?.name}
                </Text>
                <Text style={styles.previewEmissions}>
                  = {calculateEmissions(selectedCategory, parseFloat(inputValue)).toFixed(2)} kg CO₂
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={addEntry}
            >
              <Text style={styles.saveButtonText}>Add Entry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  totalCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  totalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 8,
  },
  totalSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 12,
  },
  entriesSection: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#22c55e',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  entryCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  entryCategoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  deleteButton: {
    padding: 4,
  },
  entryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  entryEmissions: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
  },
  entryDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  entryDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryButton: {
    width: (screenWidth - 64) / 2,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  categoryButtonActive: {
    backgroundColor: '#22c55e',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#374151',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  previewCard: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    color: '#166534',
    marginBottom: 4,
  },
  previewEmissions: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22c55e',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#22c55e',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default MobileCarbonCalculator;
