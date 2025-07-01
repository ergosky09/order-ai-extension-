// =================================================
// AMAZON FORM DETECTOR - TEST SCRIPT BAŞLADI
// =================================================
console.log('=====================================================');
console.log('AMAZON FORM DETECTOR TEST SCRIPT YÜKLENDI');
console.log('SAYFA URL:', window.location.href);
console.log('=====================================================');

console.log('[Amazon Form Detector] Selektör tespit script yüklendi.');

// Amazon adres formunu tespit fonksiyonu
function detectAmazonAddressForm() {
  console.log('[Amazon Form Detector] Amazon adres formu tespit ediliyor...');
  
  // Sayfa URL kontrolü
  const isAddressPage = window.location.href.includes('/gp/buy/addressselect') || 
                        window.location.href.includes('/checkout');
  
  if (!isAddressPage) {
    console.log('[Amazon Form Detector] Bu sayfa Amazon adres formu sayfası değil.');
    return;
  }
  
  // Form tespiti
  const possibleFormSelectors = [
    'form[name="address-form"]',
    'form[name="address-ui-widgets-form"]',
    'form[action*="address"]',
    'div[class*="address-form"]'
  ];
  
  let addressForm = null;
  for (const selector of possibleFormSelectors) {
    const formElement = document.querySelector(selector);
    if (formElement) {
      addressForm = formElement;
      console.log(`[Amazon Form Detector] Adres formu bulundu: ${selector}`);
      break;
    }
  }
  
  if (!addressForm) {
    console.log('[Amazon Form Detector] Adres formu bulunamadı!');
    // Sayfa yapısını analiz et
    analyzePageStructure();
    return;
  }
  
  // Form içindeki tüm input alanlarını bul
  const inputs = document.querySelectorAll('input[type="text"], input[type="tel"], select');
  
  // Selektör sonuçları
  const formSelectors = {};
  
  // Her input alanını incele
  inputs.forEach(input => {
    // Temel özellikler
    const id = input.id || '';
    const name = input.name || '';
    const placeholder = input.placeholder || '';
    const label = findLabelForInput(input);
    const value = input.value || '';
    const classes = Array.from(input.classList).join('.');
    const selector = buildUniqueSelector(input);
    
    // Alan tipi tahmini
    let fieldType = 'unknown';
    
    // ID, name, placeholder, label gibi özelliklere göre alan tipini tahmin et
    if (matchesAny(id, name, placeholder, label, ['name', 'fullname', 'full-name', 'full name', 'ad soyad', 'adsoyad'])) {
      fieldType = 'fullName';
    } else if (matchesAny(id, name, placeholder, label, ['address1', 'address-1', 'address line 1', 'line1', 'street', 'adres1', 'adres satırı 1'])) {
      fieldType = 'addressLine1';
    } else if (matchesAny(id, name, placeholder, label, ['address2', 'address-2', 'address line 2', 'line2', 'apt', 'suite', 'adres2', 'adres satırı 2'])) {
      fieldType = 'addressLine2';
    } else if (matchesAny(id, name, placeholder, label, ['city', 'town', 'şehir', 'ilçe', 'semt'])) {
      fieldType = 'city';
    } else if (matchesAny(id, name, placeholder, label, ['state', 'province', 'region', 'county', 'eyalet', 'il'])) {
      fieldType = 'stateProvince';
    } else if (matchesAny(id, name, placeholder, label, ['zip', 'postal', 'postcode', 'post code', 'post-code', 'posta kodu'])) {
      fieldType = 'postalCode';
    } else if (matchesAny(id, name, placeholder, label, ['phone', 'tel', 'telephone', 'telefon', 'cep'])) {
      fieldType = 'phone';
    } else if (matchesAny(id, name, placeholder, label, ['country', 'ülke'])) {
      fieldType = 'country';
    }
    
    if (fieldType !== 'unknown') {
      formSelectors[fieldType] = {
        id: id,
        name: name,
        placeholder: placeholder,
        label: label,
        value: value,
        classes: classes,
        selector: selector,
        element: input.tagName.toLowerCase()
      };
    }
  });
  
  console.log('[Amazon Form Detector] Tespit edilen form selektörleri:', formSelectors);
  
  // JSON olarak da yazdır (kopyalamayı kolaylaştırmak için)
  console.log('[Amazon Form Detector] Selektörler JSON formatı:');
  console.log(JSON.stringify(formSelectors, null, 2));
  
  // Eğer boş veya çoğu alan tespit edilmediyse sayfayı daha detaylı analiz et
  if (Object.keys(formSelectors).length < 3) {
    console.log('[Amazon Form Detector] Yeterli selektör bulunamadı, detaylı analiz yapılıyor...');
    analyzePageStructure();
  }
}

// String içerisinde anahtar kelimelerin olup olmadığını kontrol et
function matchesAny(id, name, placeholder, label, keywords) {
  const allText = (id + ' ' + name + ' ' + placeholder + ' ' + label).toLowerCase();
  return keywords.some(keyword => allText.includes(keyword.toLowerCase()));
}

// Input için label elementini bul
function findLabelForInput(input) {
  if (!input.id) return '';
  
  // Label for attribute ile
  const labelElement = document.querySelector(`label[for="${input.id}"]`);
  if (labelElement) return labelElement.textContent.trim();
  
  // Yakın parent içindeki label
  const parent = input.parentElement;
  if (parent) {
    const nearbyLabel = parent.querySelector('label');
    if (nearbyLabel) return nearbyLabel.textContent.trim();
  }
  
  return '';
}

// Element için benzersiz bir CSS selektörü oluştur
function buildUniqueSelector(element) {
  if (element.id) return `#${element.id}`;
  
  if (element.name) {
    return `${element.tagName.toLowerCase()}[name="${element.name}"]`;
  }
  
  // class kullanarak
  if (element.classList.length > 0) {
    const classSelector = Array.from(element.classList)
      .map(cls => `.${cls}`)
      .join('');
    return `${element.tagName.toLowerCase()}${classSelector}`;
  }
  
  // Parent elementlere göre yol oluştur
  let current = element;
  let path = [];
  
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    
    // Kardeş elementlere göre indeks
    if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children);
      const index = siblings.indexOf(current) + 1;
      if (siblings.length > 1) {
        selector += `:nth-child(${index})`;
      }
    }
    
    path.unshift(selector);
    current = current.parentElement;
  }
  
  return path.join(' > ');
}

// Sayfa yapısını analiz et (form bulunamadığında)
function analyzePageStructure() {
  console.log('[Amazon Form Detector] Sayfa yapısı analiz ediliyor...');
  
  // Tüm input alanlarını tara
  const allInputs = document.querySelectorAll('input[type="text"], input[type="tel"], select');
  console.log(`[Amazon Form Detector] Sayfada ${allInputs.length} adet input/select alanı bulundu.`);
  
  // Sayfadaki tüm form elementlerini logla
  const allForms = document.querySelectorAll('form');
  console.log(`[Amazon Form Detector] Sayfada ${allForms.length} adet form elementi bulundu.`);
  
  allForms.forEach((form, index) => {
    console.log(`[Amazon Form Detector] Form #${index+1}:`, {
      id: form.id,
      name: form.name,
      action: form.action,
      method: form.method,
      className: form.className,
      inputCount: form.querySelectorAll('input').length
    });
  });
  
  // Adres ile ilgili içerik içeren div'leri bul
  const potentialContainers = [];
  const allDivs = document.querySelectorAll('div');
  
  allDivs.forEach(div => {
    const text = div.textContent.toLowerCase();
    if (
      (text.includes('adres') || text.includes('address')) && 
      (div.querySelectorAll('input').length > 0)
    ) {
      potentialContainers.push({
        element: div,
        text: text.substring(0, 100) + '...',
        inputCount: div.querySelectorAll('input').length,
        selector: buildUniqueSelector(div)
      });
    }
  });
  
  console.log('[Amazon Form Detector] Potansiyel adres container\'ları:', potentialContainers);
}

// Sayfa yüklendiğinde veya DOM değiştiğinde tespiti çalıştır
function initDetector() {
  // Sayfa yüklendiğinde çalıştır
  detectAmazonAddressForm();
  
  // DOM değişikliklerini dinle (Amazon'un sayfasında AJAX ile değişiklikler olabilir)
  const observer = new MutationObserver(function(mutations) {
    console.log('[Amazon Form Detector] DOM değişikliği tespit edildi, form kontrolü yenileniyor...');
    detectAmazonAddressForm();
  });
  
  // Tüm DOM değişikliklerini izle
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  
  // 5 saniye sonra bir kez daha çalıştır (AJAX ile yüklenen içerikler için)
  setTimeout(detectAmazonAddressForm, 5000);
}

// Sayfanın tam yüklenmesini bekle
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDetector);
} else {
  initDetector();
}

// Daha görünür loglar için sayfa yüklendikten sonra tekrar log ekleyelim
console.log('=====================================================');
console.log('AMAZON FORM DETECTOR - SCRIPT TAMAMLANDI');
console.log('Konsol çıktılarını göremiyorsanız filtre ayarlarını kontrol edin');
console.log('====================================================='); 