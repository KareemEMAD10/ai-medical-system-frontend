import i18n from '../i18n';

export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('ar-EG').format(num);
};

export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(decimals)}%`;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatBloodPressure = (systolic, diastolic) => {
  if (!systolic || !diastolic) return '—';
  return `${systolic}/${diastolic}`;
};

export const formatBMI = (bmi) => {
  if (!bmi) return '—';
  const value = parseFloat(bmi).toFixed(1);
  let category = '';
  if (bmi < 18.5) category = i18n.t('formatters.bmi_underweight');
  else if (bmi < 25) category = i18n.t('formatters.bmi_normal');
  else if (bmi < 30) category = i18n.t('formatters.bmi_overweight');
  else category = i18n.t('formatters.bmi_obese');
  return `${value} (${category})`;
};

export const formatVitalSigns = (vitalSigns) => {
  if (!vitalSigns) return [];
  const items = [];
  if (vitalSigns.blood_pressure_systolic && vitalSigns.blood_pressure_diastolic) {
    items.push({
      label: i18n.t('formatters.vital_bp'),
      value: `${vitalSigns.blood_pressure_systolic}/${vitalSigns.blood_pressure_diastolic}`,
      unit: 'mmHg',
    });
  }
  if (vitalSigns.heart_rate) {
    items.push({
      label: i18n.t('formatters.vital_heart_rate'),
      value: vitalSigns.heart_rate,
      unit: i18n.t('formatters.unit_bpm'),
    });
  }
  if (vitalSigns.temperature) {
    items.push({
      label: i18n.t('formatters.vital_temperature'),
      value: vitalSigns.temperature,
      unit: '°C',
    });
  }
  if (vitalSigns.respiratory_rate) {
    items.push({
      label: i18n.t('formatters.vital_respiratory'),
      value: vitalSigns.respiratory_rate,
      unit: i18n.t('formatters.unit_rpm'),
    });
  }
  if (vitalSigns.oxygen_saturation) {
    items.push({
      label: i18n.t('formatters.vital_oxygen'),
      value: vitalSigns.oxygen_saturation,
      unit: '%',
    });
  }
  if (vitalSigns.weight_kg && vitalSigns.height_cm) {
    const bmi = vitalSigns.weight_kg / ((vitalSigns.height_cm / 100) ** 2);
    items.push({
      label: 'BMI',
      value: bmi.toFixed(1),
      unit: 'kg/m²',
      category: formatBMI(bmi),
    });
  } else if (vitalSigns.weight_kg) {
    items.push({
      label: i18n.t('formatters.vital_weight'),
      value: vitalSigns.weight_kg,
      unit: 'kg',
    });
  } else if (vitalSigns.height_cm) {
    items.push({
      label: i18n.t('formatters.vital_height'),
      value: vitalSigns.height_cm,
      unit: 'cm',
    });
  }
  return items;
};

export const getVitalSignIcon = (label) => {
  const icons = {
    [i18n.t('formatters.vital_bp')]: '🩸',
    [i18n.t('formatters.vital_heart_rate')]: '❤️',
    [i18n.t('formatters.vital_temperature')]: '🌡️',
    [i18n.t('formatters.vital_respiratory')]: '🌬️',
    [i18n.t('formatters.vital_oxygen')]: '💨',
    [i18n.t('formatters.vital_weight')]: '⚖️',
    [i18n.t('formatters.vital_height')]: '📏',
    'BMI': '📊',
  };
  return icons[label] || '📋';
};

export const formatMedications = (medicationsText) => {
  if (!medicationsText) return [];
  return medicationsText.split(',').map(med => med.trim());
};

export const getSeverityBadge = (level) => {
  const badges = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };
  return badges[level] || 'bg-gray-100 text-gray-800';
};

export const formatInteractionLevel = (level) => {
  const levels = {
    high: i18n.t('formatters.interaction_high'),
    medium: i18n.t('formatters.interaction_medium'),
    low: i18n.t('formatters.interaction_low'),
  };
  return levels[level] || level;
};
