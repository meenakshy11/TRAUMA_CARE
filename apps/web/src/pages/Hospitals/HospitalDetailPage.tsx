import React from 'react';
import { useParams } from 'react-router-dom';

const HospitalDetailPage: React.FC = () => {
  const { hospitalId } = useParams();
  return (
    <div style={{ padding: '2rem', color: '#f8fafc' }}>
      <h1>Hospital Detail: {hospitalId}</h1>
      <p>Specific ICU, blood bank, and OT resource tracking.</p>
    </div>
  );
};

export default HospitalDetailPage;
