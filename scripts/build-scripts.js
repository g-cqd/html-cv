// Build-time script methods for CV project
// Available during build process via @@script: syntax

export function age(birthYear, birthMonth, birthDay, lang = "en") {
  const birthDate = new Date(birthYear, birthMonth, birthDay);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  switch (lang) {
    case "fr": return `${age} ans (${birthYear})`;
    case "de": return `${age} Jahre (${birthYear})`;
    default: return `${age} y/o (${birthYear})`;
  }
}

export function yearsSince(year, month, day, lang = "en") {
  const startDate = new Date(year, month, day);
  const now = new Date();

  const years = now.getFullYear() - startDate.getFullYear();
  const months = now.getMonth() - startDate.getMonth();

  let totalYears = years;
  if (months < 0 || (months === 0 && now.getDate() < startDate.getDate())) {
    totalYears--;
  }

  if (totalYears === 0) {
    // Less than a year
    const totalMonths = (now.getFullYear() - startDate.getFullYear()) * 12 + now.getMonth() - startDate.getMonth();
    if (totalMonths <= 1) {
      switch (lang) {
        case "fr": return "< 1 an";
        case "de": return "< 1 Jahr";
        default: return "< 1 year";
      }
    } else {
      switch (lang) {
        case "fr": return `${totalMonths} mois`;
        case "de": return `${totalMonths} Monate`;
        default: return `${totalMonths} months`;
      }
    }
  } else if (totalYears === 1) {
    switch (lang) {
      case "fr": return "1 an";
      case "de": return "1 Jahr";
      default: return "1 year";
    }
  } else {
    switch (lang) {
      case "fr": return `${totalYears} ans`;
      case "de": return `${totalYears} Jahre`;
      default: return `${totalYears} years`;
    }
  }
}