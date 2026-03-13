'use client';

import React from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from '../styles/DatePicker.module.css';

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  minDate?: Date;
  showTimeSelect?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  minDate,
  showTimeSelect = true,
}) => {
  const handleChange = (date: Date | null) => {
    if (date) {
      onChange(date);
    }
  };

  return (
    <ReactDatePicker
      selected={value}
      onChange={handleChange}
      showTimeSelect={showTimeSelect}
      timeFormat="HH:mm"
      timeIntervals={15}
      dateFormat={showTimeSelect ? "dd.MM.yyyy HH:mm" : "dd.MM.yyyy"}
      className={styles.datePickerInput}
      calendarClassName={styles.calendar}
      dayClassName={() => styles.day}
      popperClassName={styles.popper}
      wrapperClassName={styles.wrapper}
      minDate={minDate}
    />
  );
};