export const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const fmtDateTime = (d) =>
  new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const CATEGORY_LABELS = {
  OPEN: 'Open', COVERED: 'Covered', GARAGE: 'Garage', STREET: 'Street', EV_CHARGING: 'EV Charging',
};

/** value for <input type="datetime-local"> */
export const toLocalInput = (date) => {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};

export const hoursBetween = (start, end) => {
  const ms = new Date(end) - new Date(start);
  return ms > 0 ? Math.ceil(ms / 3600000) : 0;
};
