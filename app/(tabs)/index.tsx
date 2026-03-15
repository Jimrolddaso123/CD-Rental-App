import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CDManagerScreen() {
  const [inventory, setInventory] = useState([
    { id: '1', title: 'Abbey Road', artist: 'The Beatles', copies: 3 },
    { id: '2', title: 'Thriller', artist: 'Michael Jackson', copies: 1 },
    { id: '3', title: 'Sour', artist: 'Olivia Rodrigo', copies: 4 },
  ]);
  const [borrowedList, setBorrowedList] = useState<any[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);

  const DAILY_PENALTY = 2;

  useEffect(() => {
    const loadData = async () => {
      try {
        const inv = await AsyncStorage.getItem('inventory');
        const bor = await AsyncStorage.getItem('borrowed');
        const inc = await AsyncStorage.getItem('income');
        if (inv) setInventory(JSON.parse(inv));
        if (bor) setBorrowedList(JSON.parse(bor));
        if (inc) setTotalIncome(parseInt(inc));
      } catch (e) { console.error("Error loading", e); }
    };
    loadData();
  }, []);

  const saveData = async (inv: any, bor: any, inc: number) => {
    try {
      await AsyncStorage.setItem('inventory', JSON.stringify(inv));
      await AsyncStorage.setItem('borrowed', JSON.stringify(bor));
      await AsyncStorage.setItem('income', inc.toString());
    } catch (e) { console.error("Error saving", e); }
  };

  const handleBorrow = (cd: any) => {
    if (cd.copies <= 0) {
      alert("CD not available"); 
      return;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const newBorrow = {
      id: Date.now().toString(),
      cdId: cd.id,
      title: cd.title,
      borrower: "Juan Dela Cruz",
      dueDate: dueDate.toISOString(),
    };

    const updatedInv = inventory.map(item => 
      item.id === cd.id ? { ...item, copies: item.copies - 1 } : item
    );
    const updatedBor = [...borrowedList, newBorrow];

    setInventory(updatedInv);
    setBorrowedList(updatedBor);
    saveData(updatedInv, updatedBor, totalIncome);
  };

  const handleReturn = (item: any) => {
    const today = new Date();
    const dueDate = new Date(item.dueDate);
    let penalty = 0;

    if (today > dueDate) {
      const diffTime = Math.abs(today.getTime() - dueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      penalty = diffDays * DAILY_PENALTY;
    }

    const updatedInv = inventory.map(cd => 
      cd.id === item.cdId ? { ...cd, copies: cd.copies + 1 } : cd
    );
    const updatedBor = borrowedList.filter(b => b.id !== item.id);
    const updatedInc = totalIncome + penalty;

    setInventory(updatedInv);
    setBorrowedList(updatedBor);
    setTotalIncome(updatedInc);
    saveData(updatedInv, updatedBor, updatedInc);

    alert(penalty > 0 ? `Late return! Penalty: PHP ${penalty}` : "Returned on time!");
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#f8f9fa'}}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>💿 CD Rental Manager</Text>

        <View style={styles.statsCard}>
          <Text style={styles.statsText}>Total Income: <Text style={styles.bold}>PHP {totalIncome}</Text></Text>
          <Text style={styles.statsText}>Active Borrows: <Text style={styles.bold}>{borrowedList.length}</Text></Text>
        </View>

        <Text style={styles.subTitle}>Available Inventory</Text>
        {inventory.map(item => (
          <View key={item.id} style={styles.card}>
            <View>
              <Text style={styles.cdTitle}>{item.title}</Text>
              <Text style={styles.cdArtist}>{item.artist}</Text>
              <Text>Copies: {item.copies}</Text>
            </View>
            <TouchableOpacity onPress={() => handleBorrow(item)} style={styles.borrowBtn}>
              <Text style={styles.btnText}>Borrow</Text>
            </TouchableOpacity>
          </View>
        ))}

        <Text style={[styles.subTitle, {marginTop: 20}]}>Borrowed List</Text>
        {borrowedList.length === 0 ? <Text style={styles.empty}>No CDs borrowed.</Text> : 
          borrowedList.map(item => (
            <View key={item.id} style={[styles.card, {borderLeftWidth: 5, borderLeftColor: '#f39c12'}]}>
              <View style={{flex: 1}}>
                <Text style={styles.cdTitle}>{item.title}</Text>
                <Text style={styles.details}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
              </View>
              <TouchableOpacity onPress={() => handleReturn(item)} style={styles.returnBtn}>
                <Text style={styles.btnText}>Return</Text>
              </TouchableOpacity>
            </View>
          ))
        }
        <View style={{height: 50}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  header: { fontSize: 26, fontWeight: 'bold', marginTop: 20, marginBottom: 20, textAlign: 'center', color: '#2c3e50' },
  statsCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 3, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  statsText: { fontSize: 16, marginBottom: 5 },
  bold: { fontWeight: 'bold' },
  subTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#34495e' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  cdTitle: { fontSize: 17, fontWeight: 'bold' },
  cdArtist: { fontSize: 14, color: '#7f8c8d' },
  details: { fontSize: 12, color: '#e67e22' },
  borrowBtn: { backgroundColor: '#3498db', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  returnBtn: { backgroundColor: '#27ae60', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  empty: { fontStyle: 'italic', color: '#95a5a6', textAlign: 'center', marginTop: 10 }
});