import React from 'react';
import { useParams } from 'wouter';

export default function CourseOverviewTest() {
  console.log('🔥 TEST COMPONENT LOADED!');
  
  const { courseId } = useParams();
  
  console.log('🔥 TEST courseId:', courseId);
  
  return (
    <div style={{ padding: '20px', backgroundColor: 'red', color: 'white' }}>
      <h1>🔥 TEST COMPONENT WORKING!</h1>
      <p>Course ID: {courseId}</p>
    </div>
  );
}