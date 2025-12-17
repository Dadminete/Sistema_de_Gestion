import React from 'react';

interface UnderConstructionProps {
  title?: string;
  message?: string;
}

const UnderConstruction: React.FC<UnderConstructionProps> = ({
  title = "Página en Construcción",
  message = "Esta sección está siendo trabajada y estará disponible próximamente."
}) => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>{title}</h1>
      <p>{message}</p>
    </div>
  );
};

export default UnderConstruction;
