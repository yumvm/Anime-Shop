import React from 'react';
import styles from '../styles/Tooltip.module.css';

function Tooltip({ text, children }) {
  return (
    <div className={styles.wrapper}>
      {children}
      <span className={styles.tooltip}>{text}</span>
    </div>
  );
}

export default Tooltip;