function calculateRisk({ heartRate, spo2 }) {
  let risk = 0;

  if (heartRate > 140 || spo2 < 88) {
    risk = 90;
  } else if (heartRate > 110 || spo2 < 94) {
    risk = 60;
  } else {
    risk = 20;
  }

  let status =
    risk > 80 ? "CRITICAL" :
    risk > 50 ? "WARNING" :
    "STABLE";

  return { risk, status };
}

module.exports = { calculateRisk };