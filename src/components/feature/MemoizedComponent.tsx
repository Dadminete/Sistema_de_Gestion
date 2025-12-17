import React, { memo } from 'react';

interface MemoizedComponentProps {
  value: number;
}

const MemoizedComponent: React.FC<MemoizedComponentProps> = memo(({ value }) => {
  console.log('MemoizedComponent rendered');
  return (
    <div>
      <h3>Memoized Component</h3>
      <p>Value: {value}</p>
    </div>
  );
});

export default MemoizedComponent;
