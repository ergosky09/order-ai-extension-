document.addEventListener('DOMContentLoaded', () => {
    // Görünümler ve Ana Elementler
    const views = {
        main: document.getElementById('main-view'),
        categories: document.getElementById('categories-view'),
        settings: document.getElementById('settings-view'),
        results: document.getElementById('results-view'),
        test: document.getElementById('test-view'),
        sellerQuery: document.getElementById('seller-query-view')
    };
    const categoryTabsContainer = document.getElementById('category-tabs');
    const categoryListContainer = document.getElementById('category-list-container');
    const addCategoryBtn = document.getElementById('add-current-category-btn');
    const addNewListBtn = document.getElementById('add-new-list-btn');
    const querySelectedBtn = document.getElementById('query-selected-btn');
    const showLastResultBtn = document.getElementById('show-last-result-btn');
    const queryStatus = document.getElementById('query-status');

    // Sonuç Elemanları (Yeni Yapı)
    const resultControlsContainer = document.querySelector('.result-controls');
    const multiColumnResultsContainer = document.getElementById('multi-column-results-container');
    const shuffleResultsBtn = document.getElementById('shuffle-results-btn');
    const deleteResultsBtn = document.getElementById('delete-results-btn');
    const singleResultContainer = document.getElementById('single-result-container');
    const singleResultCount = document.getElementById('single-result-count');
    const copySingleResultBtn = document.getElementById('copy-single-result-btn');

    // Ayar Formu Elemanları
    const saveKeepaSettingsBtn = document.getElementById('save-keepa-settings-btn');
    const settingsInputs = {
        apiKey: document.getElementById('keepa-api-key'),
        country: document.getElementById('country-select'),
        minRank: document.getElementById('min-rank'),
        maxRank: document.getElementById('max-rank'),
        minBuyboxPrice: document.getElementById('min-buybox-price'),
        maxBuyboxPrice: document.getElementById('max-buybox-price'),
        minAmazonPrice: document.getElementById('min-amazon-price'),
        maxAmazonPrice: document.getElementById('max-amazon-price'),
        minFbaPrice: document.getElementById('min-fba-price'),
        maxFbaPrice: document.getElementById('max-fba-price'),
        minFbmPrice: document.getElementById('min-fbm-price'),
        maxFbmPrice: document.getElementById('max-fbm-price'),
        minNewPrice: document.getElementById('min-new-price'),
        maxNewPrice: document.getElementById('max-new-price'),
        minCouponAbsolute: document.getElementById('min-coupon-absolute'),
        maxCouponAbsolute: document.getElementById('max-coupon-absolute'),
        minCouponPercent: document.getElementById('min-coupon-percent'),
        maxCouponPercent: document.getElementById('max-coupon-percent'),
        minSnsPercent: document.getElementById('min-sns-percent'),
        maxSnsPercent: document.getElementById('max-sns-percent'),
        minBusinessDiscount: document.getElementById('min-business-discount'),
        maxBusinessDiscount: document.getElementById('max-business-discount'),
        minRatingCount: document.getElementById('min-rating-count'),
        maxRatingCount: document.getElementById('max-rating-count'),
        minRating: document.getElementById('min-rating'),
        maxRating: document.getElementById('max-rating'),
        minMonthlySold: document.getElementById('min-monthly-sold'),
        maxMonthlySold: document.getElementById('max-monthly-sold'),
        asinCount: document.getElementById('asin-count-input'),
        minTotalOffers: document.getElementById('min-total-offers'),
        maxTotalOffers: document.getElementById('max-total-offers'),
        minNewOffers: document.getElementById('min-new-offers'),
        maxNewOffers: document.getElementById('max-new-offers'),
        minFbaOffers: document.getElementById('min-fba-offers'),
        maxFbaOffers: document.getElementById('max-fba-offers'),
        minFbmOffers: document.getElementById('min-fbm-offers'),
        maxFbmOffers: document.getElementById('max-fbm-offers'),
    };

    // Yan Panel Butonu
    const toggleSidePanelBtn = document.getElementById('toggle-side-panel-btn');

    // Navigasyon Butonları
    const goToCategoriesBtn = document.getElementById('go-to-categories-btn');
    const goToTestBtn = document.getElementById('go-to-test-view-btn');
    const goToSellerQueryBtn = document.getElementById('go-to-seller-query-btn');

    // Geri Butonları
    const backButtons = document.querySelectorAll('.back-button');

    // Görünümler arası geçiş butonları
    const goToSettingsFromCatBtn = document.getElementById('go-to-settings-from-cat-btn');
    const goToCategoriesFromSettingsBtn = document.getElementById('go-to-categories-from-settings-btn');
    const goToSellerQueryFromSettingsBtn = document.getElementById('go-to-seller-query-from-settings-btn');

    // Test Elemanları
    const startTestQueryBtn = document.getElementById('start-test-query-btn');
    const userUrlInput = document.getElementById('user-url-input');
    const startUserUrlTestBtn = document.getElementById('start-user-url-test-btn');
    const testQueryStatus = document.getElementById('test-query-status');
    const testMultiColumnResultsContainer = document.getElementById('test-multi-column-results-container');

    // Satıcı Sorgulama Elemanları
    const addCurrentSellerBtn = document.getElementById('add-current-seller-btn');
    const addNewSellerListBtn = document.getElementById('add-new-seller-list-btn');
    const sellerTabsContainer = document.getElementById('seller-tabs-container');
    const sellerListContainer = document.getElementById('seller-list-container');
    const querySellersBtn = document.getElementById('query-sellers-btn');
    const sellerResultsSection = document.getElementById('seller-results-section');
    const sellerQueryStatus = document.getElementById('seller-query-status');
    const copyAllSellerAsinsBtn = document.getElementById('copy-all-seller-asins-btn');
    const shuffleSellerAsinsBtn = document.getElementById('shuffle-seller-asins-btn');
    const deleteAllSellerResultsBtn = document.getElementById('delete-all-seller-results-btn');
    const sellerResultsContainer = document.getElementById('seller-results-container');
    const toggleSellerResultsBtn = document.getElementById('toggle-seller-results-btn');

    // "Canlı Veri Zorla" onay kutusu
    const forceLiveSellerQueryCheckbox = document.getElementById('force-live-seller-query-checkbox');

    // === UYGULAMA DURUMU (STATE) ===
    let state = {
        categoryLists: {}, // { 'Liste Adı': { categories: [...], results: [] }, ... }
        activeList: null,  // Aktif olan listenin adı
        sellerLists: {},   // { 'Liste Adı': { sellers: [...], results: [] }, ... }
        activeSellerList: null, // Aktif olan satıcı listesinin adı
    };
    const MAX_LISTS = 20;

    // === YARDIMCI FONKSİYONLAR ===
    const domainMap = {
        'com': '1',     // USA
        'co.uk': '2',   // UK
        'de': '3',      // Germany
        'fr': '4',      // France
        'co.jp': '5',   // Japan
        'ca': '6',      // Canada
        'cn': '7',      // China (API only)
        'it': '8',      // Italy
        'es': '9',      // Spain
        'in': '10',     // India
        'com.mx': '11', // Mexico
        'com.br': '12', // Brazil
        'com.au': '13', // Australia
        'ae': '14',     // UAE
        'com.tr': '15', // Turkey
        'nl': '16',     // Netherlands
        'pl': '17',     // Poland
        'se': '18',     // Sweden
        'sg': '19',     // Singapore
        'eg': '20',     // Egypt
        'sa': '21'      // Saudi Arabia
    };

    const getDomainIdFromUrl = (urlString) => {
        try {
            const hostname = new URL(urlString).hostname;
            // Kısmi eşleşmeleri önlemek için en uzun alan adından başlayarak sırala (örn: 'com.mx' vs 'com')
            const sortedTlds = Object.keys(domainMap).sort((a, b) => b.length - a.length);
            for (const tld of sortedTlds) {
                if (hostname.endsWith(`.${tld}`)) {
                    return domainMap[tld];
                }
            }
        } catch (e) {
            console.error("URL ayrıştırılamadı:", e);
        }
        return null; // Desteklenmeyen veya geçersiz URL
    };

    const promptForListName = (promptMessage) => {
        const listName = prompt(promptMessage);
        if (!listName) return null;
        if (state.categoryLists[listName]) {
            alert('Bu isimde bir liste zaten mevcut. Lütfen başka bir isim seçin.');
            return null;
        }
        return listName.trim();
    };
    
    const promptForNewListName = (listObject, promptMessage) => {
        const listName = prompt(promptMessage);
        if (!listName) return null;
        if (listObject[listName]) {
            alert('Bu isimde bir liste zaten mevcut. Lütfen başka bir isim seçin.');
            return null;
        }
        return listName.trim();
    };
    
    const saveState = () => chrome.storage.local.set({ state });

    // === ANA RENDER FONKSİYONLARI ===
    const renderUI = () => {
        renderTabs();
        renderCategories();
        // Sorgulama butonunu sadece liste varsa aktif et
        const listExists = !!state.activeList;
        const lastResultExists = listExists && state.categoryLists[state.activeList]?.results?.length > 0;

        querySelectedBtn.disabled = !listExists;
        querySelectedBtn.style.opacity = listExists ? '1' : '0.5';

        // Sonuç kontrol butonlarını göster/gizle
        resultControlsContainer.style.display = lastResultExists ? 'flex' : 'none';
    };
    
    function renderTabs() {
    categoryTabsContainer.innerHTML = '';
        Object.keys(state.categoryLists).forEach(listName => {
        const tab = document.createElement('button');
            tab.className = 'tab-button';
            tab.textContent = listName;
            tab.dataset.listName = listName;
            if (listName === state.activeList) tab.classList.add('active');
            
            const deleteBtn = document.createElement('span');
            deleteBtn.className = 'delete-tab-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.title = `'${listName}' listesini sil`;
            deleteBtn.dataset.listName = listName;
            tab.appendChild(deleteBtn);
            
        categoryTabsContainer.appendChild(tab);
        });
    }
    
    function renderCategories() {
        if (!state.activeList) {
            categoryListContainer.innerHTML = `<p style="text-align:center;color:#6b7280;padding:20px 0;">Başlamak için yeni bir liste oluşturun.</p>`;
            return;
        }

        const listObject = state.categoryLists[state.activeList];
        if (!listObject || !listObject.categories) {
            categoryListContainer.innerHTML = `<p style="text-align:center;color:#6b7280;padding:20px 0;">Bu listede henüz kategori yok.</p>`;
            return;
        }

        const categories = listObject.categories;
        categoryListContainer.innerHTML = '';
        if (categories.length === 0) {
            categoryListContainer.innerHTML = `<p style="text-align:center;color:#6b7280;padding:20px 0;">Bu listede henüz kategori yok.</p>`;
            return;
        }
        categories.forEach((cat, index) => {
            const item = document.createElement('div');
            item.className = 'category-item';
            const displayId = cat.id.length > 6 ? cat.id.substring(0, 6) + '...' : cat.id;
            item.innerHTML = `
                <input type="checkbox" class="category-select" data-id="${cat.id}" ${cat.selected ? 'checked' : ''}>
                <span class="category-number">${index + 1}.</span>
                <a href="#" class="category-link" data-id="${cat.id}" title="ID: ${cat.id} | Kategoriyi yeni sekmede aç">${displayId}</a>
                <span class="category-name">${cat.name}</span>
                <input type="text" class="category-note" placeholder="Not..." data-id="${cat.id}" value="${cat.note || ''}">
                <button class="delete-category-btn" data-id="${cat.id}" title="Kategoriyi sil">🗑️</button>`;
            categoryListContainer.appendChild(item);
        });
    }

    // === OLAY DİNLEYİCİLERİ (EVENT LISTENERS) ===
    
    // Ana Menü Navigasyonu
    if(goToCategoriesBtn) goToCategoriesBtn.addEventListener('click', () => viewManager.navigate('categories'));
    if(goToSellerQueryBtn) goToSellerQueryBtn.addEventListener('click', () => viewManager.navigate('sellerQuery'));
    if(goToTestBtn) goToTestBtn.addEventListener('click', () => viewManager.navigate('test'));
    if(backButtons) {
        backButtons.forEach(button => {
            button.addEventListener('click', () => viewManager.goBack());
        });
    }

    // Görünümler Arası Özel Navigasyonlar
    if (goToSettingsFromCatBtn) goToSettingsFromCatBtn.addEventListener('click', () => viewManager.navigate('settings'));
    if (goToCategoriesFromSettingsBtn) goToCategoriesFromSettingsBtn.addEventListener('click', () => viewManager.navigate('categories'));
    if (goToSellerQueryFromSettingsBtn) goToSellerQueryFromSettingsBtn.addEventListener('click', () => viewManager.navigate('sellerQuery'));
    
    // Yeni Liste Ekle Butonu
    addNewListBtn.addEventListener('click', async () => {
        if (Object.keys(state.categoryLists).length >= MAX_LISTS) {
            alert(`Maksimum liste sayısına ulaştınız (${MAX_LISTS}).`);
            return;
        }
        const listName = promptForNewListName(state.categoryLists, 'Yeni kategori listesinin adını girin:');
        if (listName) {
            state.categoryLists[listName] = { categories: [], results: [] };
            state.activeList = listName;
            await saveState();
            renderUI();
        }
    });
    
    // Satıcı Listesi Ekle Butonu
    if (addNewSellerListBtn) {
        addNewSellerListBtn.addEventListener('click', async () => {
            if (Object.keys(state.sellerLists).length >= MAX_LISTS) {
                alert(`Maksimum satıcı listesi sayısına ulaştınız (${MAX_LISTS}).`);
                return;
            }
            const listName = promptForNewListName(state.sellerLists, 'Yeni satıcı listesinin adını girin:');
            if (listName) {
                state.sellerLists[listName] = { sellers: [], results: [] };
                state.activeSellerList = listName;
                await saveState();
                renderSellerUI();
            }
        });
    }
    
    // Aktif Satıcıyı Ekle Butonu
    if (addCurrentSellerBtn) {
        addCurrentSellerBtn.addEventListener('click', async () => {
            // Adım 1: Aktif bir liste olup olmadığını kontrol et.
            if (!state.activeSellerList) {
                // Eğer liste yoksa, yeni bir tane oluşturulmasını iste.
                const listName = promptForNewListName(state.sellerLists, 'İlk satıcı listenizi oluşturmak için bir ad girin:');
                if (!listName) return; // Kullanıcı iptal etti.

                state.sellerLists[listName] = { sellers: [], results: [] };
                state.activeSellerList = listName;
                // UI render ve saveState en sonda yapılacak.
            }

            // Adım 2: Aktif listeyi al ve satıcı sayısını kontrol et.
            const activeListObject = state.sellerLists[state.activeSellerList];
            if (activeListObject.sellers.length >= 10) {
                alert('Bir listeye en fazla 10 satıcı ekleyebilirsiniz. Lütfen yeni bir satıcı eklemek için mevcut olanlardan birini silin.');
                return; // Fonksiyondan çık.
            }

            // Adım 3: Aktif sekmeden satıcı bilgilerini al.
            try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!tab || !tab.url || !tab.url.includes('amazon.')) {
                    alert('Lütfen bir Amazon satıcı sayfasındayken tekrar deneyin.');
            return;
        }

                const url = new URL(tab.url);
                const sellerId = url.searchParams.get('seller') || url.searchParams.get('me');
                const domainId = getDomainIdFromUrl(tab.url);

                if (!sellerId) {
                    alert("Bu URL'de bir satıcı ID ('seller=' veya 'me=') bulunamadı.");
            return;
        }

                if (!domainId) {
                    alert("Bu Amazon pazar yeri desteklenmiyor veya URL'den pazar yeri bilgisi alınamadı.");
            return;
        }
        
                // Satıcı adını sayfa başlığından al
                let sellerName = 'İsim Alınamadı';
                if (tab.title) {
                    const titleParts = tab.title.split(':');
                    if (titleParts.length > 1) {
                        sellerName = titleParts[titleParts.length - 1].trim();
                    }
                }

                const newSeller = {
                    id: sellerId,
                    name: sellerName,
                    url: tab.url,
                    note: '',
                    selected: true,
                    domainId: domainId
                };

                // Adım 4: Satıcının listede olup olmadığını kontrol et.
                if (activeListObject.sellers.some(s => s.id === newSeller.id)) {
                    alert('Bu satıcı bu listede zaten mevcut.');
            return;
        }

                // Adım 5: Satıcıyı listeye ekle.
                activeListObject.sellers.push(newSeller);

            } catch (error) {
                console.error("Satıcı bilgileri alınırken hata oluştu:", error);
                alert("Geçerli bir Amazon URL'si bulunamadı veya bir hata oluştu.");
            }
            
            // Adım 6: Değişiklikleri kaydet ve arayüzü güncelle.
        await saveState();
            renderSellerUI();
    });
    }

    // Sekme Konteynerı (Sekme Değiştirme ve Silme)
    categoryTabsContainer.addEventListener('click', async (e) => {
        const listName = e.target.dataset.listName;
        if (!listName) return;

        // Sekme silme
        if (e.target.matches('.delete-tab-btn')) {
            if (confirm(`'${listName}' listesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
                delete state.categoryLists[listName];
                // Eğer silinen sekme aktif ise, başka bir sekmeyi aktif yap
                if (state.activeList === listName) {
                    const remainingLists = Object.keys(state.categoryLists);
                    state.activeList = remainingLists.length > 0 ? remainingLists[0] : null;
                }
                await saveState();
                renderUI();
            }
        } 
        // Sekme değiştirme
        else if (e.target.matches('.tab-button') && state.activeList !== listName) {
            state.activeList = listName;
            await saveState();
            renderUI();
        }
    });

    categoryListContainer.addEventListener('click', async (e) => {
        const target = e.target;
        const catId = target.dataset.id;
        if (!catId || !state.activeList) return;

        const listObject = state.categoryLists[state.activeList];
        if (!listObject) return;

        const category = listObject.categories.find(c => c.id === catId);
        if (!category) return;

        if (target.matches('.category-select')) {
            category.selected = target.checked;
        } else if (target.matches('.delete-category-btn')) {
            listObject.categories = listObject.categories.filter(c => c.id !== catId);
            renderCategories(); // Sadece kategorileri yeniden çiz
        } else if (target.matches('.category-link')) {
            e.preventDefault();
            if (category.url) {
                window.open(category.url, '_blank');
            }
        } else {
            return; // Diğer tıklamaları önemseme
        }
        await saveState();
    });

    categoryListContainer.addEventListener('change', async (e) => {
        const target = e.target;
        if (target.matches('.category-note')) {
            const catId = target.dataset.id;
            const listObject = state.categoryLists[state.activeList];
            const category = listObject?.categories.find(c => c.id === catId);
            if (category) {
                category.note = target.value;
                await saveState();
            }
        }
    });

    function parseCategoryName(title, url) {
        if (title && title.includes('Amazon.com: ')) return title.split('Amazon.com: ')[1].split(' at ')[0].trim();
        try {
            const path = new URL(url).pathname.split('/');
            const namePart = path.find(p => /^[a-zA-Z-]+$/.test(p) && p.length > 4);
            if(namePart) return namePart.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        } catch(e) {}
        const nodeIdMatch = url.match(/node=(\d+)/);
        return nodeIdMatch ? `Kategori ID: ${nodeIdMatch[1]}` : 'Bilinmeyen Kategori';
    }

    // === SORGULAMA VE SONUÇLAR ===
    
    function buildKeepaUrl(settings, categoryIds) {
        if (!settings || !settings.apiKey) {
            console.error('Keepa API anahtarı bulunamadı.');
            alert('Lütfen Ayarlar bölümünden Keepa API anahtarınızı girin.');
            return null;
        }

        // Kullanıcının istediği ASIN sayısını sakla
        const requestedAsinCount = settings.asinCount ? parseInt(settings.asinCount, 10) : 100;
        
        // Seçim kriterlerini (selection) bir obje olarak oluşturalım.
        const selection = {
            sort: [["current_SALES", "asc"]],
            page: 0,
            // 50'nin altındaki değerler için 50 kullan, ama orijinal değeri sakla
            perPage: requestedAsinCount < 50 ? 50 : requestedAsinCount,
            categories_include: categoryIds
        };
        
        // Ürün Tipleri
        // Kaydedilmiş değerler string, API integer bekliyor.
        if (settings.productTypes && settings.productTypes.length > 0) {
            selection.productType = settings.productTypes.map(type => parseInt(type, 10));
        } else {
            // Hiçbiri seçili değilse, varsayılan olarak sadece fiziksel ürünleri (0) sorgula.
            selection.productType = [0]; 
        }

        // Genel Filtreler (Fiyatlar cent cinsinden olmalı)
        if (settings.minRank && settings.minRank.trim() !== '') selection.current_SALES_gte = parseInt(settings.minRank, 10);
        if (settings.maxRank && settings.maxRank.trim() !== '') selection.current_SALES_lte = parseInt(settings.maxRank, 10);
        
        // Buybox Fiyat Aralığı veya Buybox Olmayanlar
        if (settings.buyboxOutOfStock) {
            selection.current_BUY_BOX_SHIPPING_gte = -1;
            selection.current_BUY_BOX_SHIPPING_lte = -1;
        } else {
            if (settings.minBuyboxPrice && settings.minBuyboxPrice.trim() !== '') selection.current_BUY_BOX_SHIPPING_gte = parseFloat(settings.minBuyboxPrice) * 100;
            if (settings.maxBuyboxPrice && settings.maxBuyboxPrice.trim() !== '') selection.current_BUY_BOX_SHIPPING_lte = parseFloat(settings.maxBuyboxPrice) * 100;
        }

        // Amazon Fiyat Aralığı veya Amazon Fiyatı Olmayanlar
        if (settings.amazonOutOfStock) {
            selection.current_AMAZON_gte = -1;
            selection.current_AMAZON_lte = -1;
        } else {
            if (settings.minAmazonPrice && settings.minAmazonPrice.trim() !== '') selection.current_AMAZON_gte = parseFloat(settings.minAmazonPrice) * 100;
            if (settings.maxAmazonPrice && settings.maxAmazonPrice.trim() !== '') selection.current_AMAZON_lte = parseFloat(settings.maxAmazonPrice) * 100;
        }

        // FBA Fiyat Aralığı veya FBA Fiyatı Olmayanlar
        if (settings.fbaOutOfStock) {
            selection.current_NEW_FBA_gte = -1;
            selection.current_NEW_FBA_lte = -1;
        } else {
            if (settings.minFbaPrice && settings.minFbaPrice.trim() !== '') selection.current_NEW_FBA_gte = parseFloat(settings.minFbaPrice) * 100;
            if (settings.maxFbaPrice && settings.maxFbaPrice.trim() !== '') selection.current_NEW_FBA_lte = parseFloat(settings.maxFbaPrice) * 100;
        }

        // FBM Fiyat Aralığı veya FBM Fiyatı Olmayanlar
        if (settings.fbmOutOfStock) {
            selection.current_NEW_FBM_SHIPPING_gte = -1;
            selection.current_NEW_FBM_SHIPPING_lte = -1;
        } else {
            if (settings.minFbmPrice && settings.minFbmPrice.trim() !== '') selection.current_NEW_FBM_SHIPPING_gte = parseFloat(settings.minFbmPrice) * 100;
            if (settings.maxFbmPrice && settings.maxFbmPrice.trim() !== '') selection.current_NEW_FBM_SHIPPING_lte = parseFloat(settings.maxFbmPrice) * 100;
        }

        // En Düşük Yeni Fiyat veya Fiyatı Olmayanlar
        if (settings.newPriceOutOfStock) {
            selection.current_NEW_gte = -1;
            selection.current_NEW_lte = -1;
        } else {
            if (settings.minNewPrice && settings.minNewPrice.trim() !== '') selection.current_NEW_gte = parseFloat(settings.minNewPrice) * 100;
            if (settings.maxNewPrice && settings.maxNewPrice.trim() !== '') selection.current_NEW_lte = parseFloat(settings.maxNewPrice) * 100;
        }

        if (settings.minCouponAbsolute && settings.minCouponAbsolute.trim() !== '') selection.couponOneTimeAbsolute_gte = parseFloat(settings.minCouponAbsolute) * 100;
        if (settings.maxCouponAbsolute && settings.maxCouponAbsolute.trim() !== '') selection.couponOneTimeAbsolute_lte = parseFloat(settings.maxCouponAbsolute) * 100;
        if (settings.minCouponPercent && settings.minCouponPercent.trim() !== '') selection.couponOneTimePercent_gte = parseInt(settings.minCouponPercent, 10);
        if (settings.maxCouponPercent && settings.maxCouponPercent.trim() !== '') selection.couponOneTimePercent_lte = parseInt(settings.maxCouponPercent, 10);
        if (settings.minSnsPercent && settings.minSnsPercent.trim() !== '') selection.couponSNSPercent_gte = parseInt(settings.minSnsPercent, 10);
        if (settings.maxSnsPercent && settings.maxSnsPercent.trim() !== '') selection.couponSNSPercent_lte = parseInt(settings.maxSnsPercent, 10);
        if (settings.minBusinessDiscount && settings.minBusinessDiscount.trim() !== '') selection.businessDiscount_gte = parseInt(settings.minBusinessDiscount, 10);
        if (settings.maxBusinessDiscount && settings.maxBusinessDiscount.trim() !== '') selection.businessDiscount_lte = parseInt(settings.maxBusinessDiscount, 10);
        if (settings.minRatingCount && settings.minRatingCount.trim() !== '') selection.current_COUNT_REVIEWS_gte = parseInt(settings.minRatingCount, 10);
        if (settings.maxRatingCount && settings.maxRatingCount.trim() !== '') selection.current_COUNT_REVIEWS_lte = parseInt(settings.maxRatingCount, 10);
        
        // Ürün Puanı (Rating) - Kullanıcı 1-5 arası girer, API 10-50 arası bekler.
        const processRating = (rating) => {
            if (!rating || rating.trim() === '') return null;
            const a = parseFloat(rating.replace(',', '.'));
            if (isNaN(a)) return null;
            return Math.round(a * 10);
        };
        const minRating = processRating(settings.minRating);
        if (minRating !== null) selection.current_RATING_gte = minRating;

        const maxRating = processRating(settings.maxRating);
        if (maxRating !== null) selection.current_RATING_lte = maxRating;

        if (settings.minMonthlySold && settings.minMonthlySold.trim() !== '') selection.monthlySold_gte = parseInt(settings.minMonthlySold, 10);
        if (settings.maxMonthlySold && settings.maxMonthlySold.trim() !== '') selection.monthlySold_lte = parseInt(settings.maxMonthlySold, 10);

        // Satıcı ve Teklif Sayıları
        if (settings.minTotalOffers && settings.minTotalOffers.trim() !== '') selection.totalOfferCount_gte = parseInt(settings.minTotalOffers, 10);
        if (settings.maxTotalOffers && settings.maxTotalOffers.trim() !== '') selection.totalOfferCount_lte = parseInt(settings.maxTotalOffers, 10);
        if (settings.minNewOffers && settings.minNewOffers.trim() !== '') selection.current_COUNT_NEW_gte = parseInt(settings.minNewOffers, 10);
        if (settings.maxNewOffers && settings.maxNewOffers.trim() !== '') selection.current_COUNT_NEW_lte = parseInt(settings.maxNewOffers, 10);
        if (settings.minFbaOffers && settings.minFbaOffers.trim() !== '') selection.offerCountFBA_gte = parseInt(settings.minFbaOffers, 10);
        if (settings.maxFbaOffers && settings.maxFbaOffers.trim() !== '') selection.offerCountFBA_lte = parseInt(settings.maxFbaOffers, 10);
        if (settings.minFbmOffers && settings.minFbmOffers.trim() !== '') selection.offerCountFBM_gte = parseInt(settings.minFbmOffers, 10);
        if (settings.maxFbmOffers && settings.maxFbmOffers.trim() !== '') selection.offerCountFBM_lte = parseInt(settings.maxFbmOffers, 10);

        // Varyasyon Durumu
        if (settings.variationStatus) {
            if (settings.variationStatus === 'yes') {
                selection.isVariation = true;
            } else if (settings.variationStatus === 'no') {
                selection.isVariation = false;
            }
        }

        // Her üründen sadece bir varyasyon göster
        if (settings.singleVariation === true) {
            selection.singleVariation = true;
        }

        // Son teklif güncelleme zamanı (Son 30 gün içinde güncellenenleri getir)
        const thirtyDaysInMinutes = 30 * 24 * 60;
        const minutesSinceKeepaEpoch = Math.floor((Date.now() / 60000) - 21564000);
        selection.lastOffersUpdate_gte = minutesSinceKeepaEpoch - thirtyDaysInMinutes;

        const selectionString = encodeURIComponent(JSON.stringify(selection));
        const domain = settings.country || '1'; // Varsayılan pazar yeri 1 (ABD)
        
        // Orijinal ASIN sayısını URL'ye ekle
        return {
            url: `https://api.keepa.com/query?key=${settings.apiKey}&domain=${domain}&selection=${selectionString}`,
            requestedAsinCount: requestedAsinCount
        };
    }

    querySelectedBtn.addEventListener('click', async () => {
        const { keepaSettings } = await chrome.storage.local.get('keepaSettings');
        if (!keepaSettings || !keepaSettings.apiKey) {
            alert('Lütfen Ayarlar bölümünden Keepa API anahtarınızı girin.');
            viewManager.navigate('settings');
            return;
        }

        const currentList = state.categoryLists[state.activeList];
        const selectedCategories = currentList.categories.filter(c => c.selected);

        if (selectedCategories.length === 0) {
            alert('Lütfen sorgulamak için en az bir kategori seçin.');
            return;
        }

        queryStatus.textContent = 'Sorgulanıyor...';
        queryStatus.style.display = 'block';
        querySelectedBtn.disabled = true;

        const selectedCategoryIds = selectedCategories.map(c => String(c.id));
        const keepaRequest = buildKeepaUrl(keepaSettings, selectedCategoryIds);
        
        console.log("Oluşturulan Keepa URL (mesaj gönderilecek):", keepaRequest.url);

        chrome.runtime.sendMessage({ action: 'keepa-query', url: keepaRequest.url }, async (response) => {
            querySelectedBtn.disabled = false; // Butonu tekrar aktif et

            if (chrome.runtime.lastError || !response || !response.success) {
                const errorMessage = chrome.runtime.lastError ? chrome.runtime.lastError.message : (response ? response.error : 'Bilinmeyen bir hata oluştu.');
                console.error("Sorgulama sırasında hata:", errorMessage);
                queryStatus.textContent = `Hata: ${errorMessage}`;
                return;
            }

            const data = response.data;
            if (data.error) {
                console.error("Keepa API Hatası:", data.error.message);
                queryStatus.textContent = `Hata: ${data.error.message}`;
                return;
            }

            let asins = [];
            if (data.asinList) {
                asins = data.asinList;
            } else if (data.products) {
                asins = data.products.map(p => p.asin).filter(Boolean);
            }
            
            // Eğer kullanıcı 50'den az ASIN istediyse, sadece o kadar ASIN al
            if (keepaRequest.requestedAsinCount < 50) {
                asins = asins.slice(0, keepaRequest.requestedAsinCount);
            }
            
            queryStatus.textContent = `${asins.length} benzersiz ASIN bulundu.`;
            setTimeout(() => { queryStatus.style.display = 'none'; }, 4000);
            
            const sortedAsins = asins.sort();
            
            // Sonuçları state'e kaydet (yeni mantık)
            let currentResults = state.categoryLists[state.activeList].results || [];
            currentResults.unshift(sortedAsins); // Yeni sonucu başa ekle
            state.categoryLists[state.activeList].results = currentResults.slice(0, 20); // Son 20'yi tut

            await saveState();

            // 1. Çoklu kolon görünümünü (varsa) güncelle.
            displayMultiColumnResults(state.categoryLists[state.activeList].results);
            // 2. Kullanıcıyı sadece son sonucu gösteren sayfaya yönlendir.
            displaySingleResult(sortedAsins); 
            
            renderUI();
        });
    });
    
    showLastResultBtn.addEventListener('click', () => {
        // Bu buton artık Kategori Yönetimi sayfasındaki çoklu kolon görünümünü açıp kapatacak
        const isVisible = multiColumnResultsContainer.style.display === 'flex';
        if (isVisible) {
            multiColumnResultsContainer.style.display = 'none';
            shuffleResultsBtn.style.display = 'none'; // Karıştır butonunu da gizle
        } else {
            const results = state.categoryLists[state.activeList]?.results || [];
            if (results.length > 0) {
                displayMultiColumnResults(results); // Sadece gösterir, view değiştirmez
            } else {
                alert('Gösterilecek kaydedilmiş bir sonuç bulunmuyor.');
            }
        }
    });
    
    // Sadece en son sonucu ayrı bir sayfada gösteren fonksiyon
    async function displaySingleResult(asins) {
        const count = asins ? asins.length : 0;
        
        // Başlığı ve butonu güncelle
        singleResultCount.textContent = count;
        copySingleResultBtn.disabled = count === 0;

        if (count === 0) {
            singleResultContainer.innerHTML = '<p>Sonuç bulunamadı.</p>';
        } else {
            singleResultContainer.innerHTML = asins.map(asin => `<div><a href="https://www.amazon.com/dp/${asin}" target="_blank">${asin}</a></div>`).join('');
        }
        
        // Kopyala butonuna olay dinleyici ata (Sadece burada tanımlanmalı)
        copySingleResultBtn.onclick = () => {
            if (count > 0) {
                navigator.clipboard.writeText(asins.join('\n'))
                    .then(() => {
                        copySingleResultBtn.textContent = 'Kopyalandı!';
                        setTimeout(() => copySingleResultBtn.textContent = 'Sonucu Kopyala', 2000);
                    })
                    .catch(err => alert('Kopyalama başarısız oldu: ' + err));
            }
        };
        
        viewManager.navigate('results'); // Sonuç görünümünü göster
    }

    // Kategori Yönetimi sayfasında çoklu kolonları gösteren fonksiyon
    async function displayMultiColumnResults(resultsArray) {
        multiColumnResultsContainer.innerHTML = ''; // Konteyneri temizle
        if (resultsArray.length === 0) {
             multiColumnResultsContainer.style.display = 'none';
             shuffleResultsBtn.style.display = 'none';
            return;
        }

        const { keepaSettings } = await chrome.storage.local.get('keepaSettings');
        const countryCode = keepaSettings?.country ? {
            '1': 'com', '2': 'de', '3': 'co.uk', '4': 'ca', '5': 'fr', 
            '6': 'co.jp', '7': 'it', '8': 'com.mx', '9': 'es', '10': 'in'
        }[keepaSettings.country] : 'com';

        // Normal sonuç kolonlarını oluştur
        resultsArray.forEach((asinList, index) => {
            const column = document.createElement('div');
            column.className = 'result-column';
            column.dataset.colIndex = index;
            
            // Kolon Başlığı ve Kopyala Butonu - Dikey düzen
            column.innerHTML = `
                <div class="result-column-header">
                    <div class="query-name">Sorgu ${index + 1}</div>
                    <div class="asin-count">${asinList.length} ASIN</div>
                    <button class="action-button copy-column-btn" data-col-index="${index}">Bu Kolonu Kopyala</button>
                    <button class="delete-result-column-btn" title="Bu sonucu sil">&times;</button>
                </div>
            `;
            
            const content = document.createElement('div');
            content.className = 'result-column-content';

            if (asinList.length > 0) {
                 asinList.forEach(asin => {
                    const item = document.createElement('a');
                    item.href = `https://www.amazon.${countryCode}/dp/${asin}`;
                    item.className = 'asin-link-item';
                    item.textContent = asin;
                    item.target = '_blank';
                    content.appendChild(item);
                });
            } else {
                content.innerHTML = '<p style="text-align:center;color:#6b7280;">Sonuç yok.</p>';
            }
            column.appendChild(content);
            multiColumnResultsContainer.appendChild(column);
        });
        
        multiColumnResultsContainer.style.display = 'flex'; // Konteyneri görünür yap
        // Karıştır butonu, kolonlar görünürse ve içinde veri varsa görünür olacak
        shuffleResultsBtn.style.display = resultsArray.flat().length > 0 ? 'inline-block' : 'none';
        
        // Butonun durumunu CSS sınıfı ile yönet
        if (resultsArray.length < 2) {
            shuffleResultsBtn.classList.add('is-disabled');
        } else {
            shuffleResultsBtn.classList.remove('is-disabled');
        }
    }

    // Kolon Kopyala ve Silme Butonları için olay dinleyicileri
    multiColumnResultsContainer.addEventListener('click', async (e) => {
        if (e.target.matches('.copy-column-btn')) {
            const colIndex = e.target.dataset.colIndex;
            const results = state.categoryLists[state.activeList]?.results || [];
            if (results[colIndex]) {
                const textToCopy = results[colIndex].join('\n');
                navigator.clipboard.writeText(textToCopy).then(() => {
                    alert(`Sorgu ${Number(colIndex) + 1} (${results[colIndex].length} ASIN) panoya kopyalandı!`);
                });
            }
        }
        if (e.target.matches('.copy-shuffled-btn')) {
            const shuffledAsinsText = e.target.dataset.shuffledAsins;
            const asinCount = shuffledAsinsText.split('\n').length;
            navigator.clipboard.writeText(shuffledAsinsText).then(() => {
                alert(`Karışık listedeki ${asinCount} ASIN panoya kopyalandı!`);
            });
        }
        if (e.target.matches('.delete-result-column-btn')) {
            const column = e.target.closest('.result-column');
            const colIndex = column.dataset.colIndex;
            
            if (state.activeList) {
                if (column.dataset.isShuffled === 'true') {
                    // Karışık kolonu sil
                    column.remove();
                } else {
                    // Normal kolonu sil
                    if (confirm(`Sorgu ${Number(colIndex) + 1} sonucunu silmek istediğinizden emin misiniz?`)) {
                        const listObject = state.categoryLists[state.activeList];
                        listObject.results.splice(colIndex, 1);
                        await saveState();
                        displayMultiColumnResults(listObject.results);
                    }
                }
            }
        }
    });

    shuffleResultsBtn.addEventListener('click', () => {
        const results = state.categoryLists[state.activeList]?.results || [];
        
        // Tıklama anında kontrol et
        if (results.length < 2) {
            alert('Sonuçları karıştırmak için en az 2 sonuç kolonu olmalıdır!');
            return; // İşlemi durdur
        }

        // Her kategoriden ASIN'leri ayrı ayrı al
        const categoryAsins = results.map(category => [...category]);
        
        // Karışık listeyi oluştur
        const shuffledAsins = [];
        let hasMoreAsins = true;

        // Her kategoriden sırayla ASIN al
        while (hasMoreAsins) {
            hasMoreAsins = false;
            
            // Her kategoriden bir ASIN al
            for (let i = 0; i < categoryAsins.length; i++) {
                if (categoryAsins[i].length > 0) {
                    // Rastgele bir ASIN seç
                    const randomIndex = Math.floor(Math.random() * categoryAsins[i].length);
                    const asin = categoryAsins[i][randomIndex];
                    
                    // Seçilen ASIN'i listeye ekle ve kategoriden çıkar
                    shuffledAsins.push(asin);
                    categoryAsins[i].splice(randomIndex, 1);
                    
                    hasMoreAsins = true;
                }
            }
        }

        // Karışık kolonu oluştur
        const column = document.createElement('div');
        column.className = 'result-column';
        column.dataset.isShuffled = 'true';
        
        const asinsAsText = shuffledAsins.join('\n');

        column.innerHTML = `
            <div class="result-column-header">
                <div class="query-name">Karışık Liste</div>
                <div class="asin-count">${shuffledAsins.length} ASIN</div>
                <button class="action-button copy-shuffled-btn" data-shuffled-asins="${asinsAsText}">Karışık Listeyi Kopyala</button>
                <button class="delete-result-column-btn" title="Bu sonucu sil">&times;</button>
            </div>
        `;
            
        const content = document.createElement('div');
        content.className = 'result-column-content';

        const { keepaSettings } = chrome.storage.local.get('keepaSettings');
        const countryCode = keepaSettings?.country ? {
            '1': 'com', '2': 'de', '3': 'co.uk', '4': 'ca', '5': 'fr', 
            '6': 'co.jp', '7': 'it', '8': 'com.mx', '9': 'es', '10': 'in'
        }[keepaSettings.country] : 'com';

        shuffledAsins.forEach(asin => {
            const item = document.createElement('a');
            item.href = `https://www.amazon.${countryCode}/dp/${asin}`;
            item.className = 'asin-link-item';
            item.textContent = asin;
            item.target = '_blank';
            content.appendChild(item);
        });
        column.appendChild(content);

        // Eğer zaten karışık kolon varsa eskisini sil, yenisini ekle
        const existingShuffleColumn = multiColumnResultsContainer.querySelector('[data-is-shuffled="true"]');
        if(existingShuffleColumn) existingShuffleColumn.remove();

        multiColumnResultsContainer.appendChild(column);
        
        // Butonu kısa süreliğine pasif yap (art arda tıklamayı önlemek için)
        shuffleResultsBtn.classList.add('is-disabled');
        setTimeout(() => {
            // 1 saniye sonra, hala 2'den az kolon yoksa butonu tekrar aktif et
            if((state.categoryLists[state.activeList]?.results || []).length >= 2) {
                shuffleResultsBtn.classList.remove('is-disabled');
            }
        }, 1000);
    });

    // === YAN PANEL YÖNETİMİ ===
    async function updateButtonState() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            const { enabled } = await chrome.sidePanel.getOptions({ tabId: tab.id });
            toggleSidePanelBtn.querySelector('.text').textContent = enabled ? 'Yan Paneli Kapat' : 'Yan Paneli Aç';
        }
    }
    toggleSidePanelBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return;
        const { enabled } = await chrome.sidePanel.getOptions({ tabId: tab.id });
        if (enabled) {
            await chrome.sidePanel.setOptions({ tabId: tab.id, enabled: false });
        } else {
            await chrome.sidePanel.setOptions({ tabId: tab.id, path: 'sidepanel.html', enabled: true });
            await chrome.sidePanel.open({ windowId: tab.windowId });
        }
        updateButtonState();
    });

    // === AYARLARI KAYDETME VE YÜKLEME ===
    function populateSelects() {
        const countries = {'1':'ABD (.com)','2':'İngiltere (.co.uk)','3':'Almanya (.de)','4':'Fransa (.fr)','5':'Japonya (.co.jp)','6':'Kanada (.ca)','8':'İtalya (.it)','9':'İspanya (.es)','10':'Hindistan (.in)','11':'Meksika (.com.mx)','12':'Brezilya (.com.br)'};
        
        if (settingsInputs.country) {
            for (const [key, value] of Object.entries(countries)) {
                settingsInputs.country.add(new Option(value, key));
            }
        }
    }

    saveKeepaSettingsBtn.addEventListener('click', async () => {
        // Validation check for monthly sold
        const maxMonthlySoldInput = document.getElementById('max-monthly-sold');
        if (maxMonthlySoldInput && maxMonthlySoldInput.value.trim() !== '') {
            const maxMonthlySoldValue = parseInt(maxMonthlySoldInput.value, 10);
            if (maxMonthlySoldValue % 50 !== 0) {
                alert('Hata: Maksimum Aylık Satış Adedi 50\'nin katı olmalıdır (örn: 50, 100, 150). Ayarlar kaydedilmedi.');
                return; // Stop the save process
            }
        }

        const { keepaSettings } = await chrome.storage.local.get('keepaSettings');
        const newSettings = keepaSettings || {};
        
        const toCamelCase = str => str.replace(/-([a-z])/g, g => g[1].toUpperCase());

        Object.keys(settingsInputs).forEach(key => {
            const input = settingsInputs[key];
            if (input) { // Ensure the input element exists
                const camelCaseKey = toCamelCase(key);
                newSettings[camelCaseKey] = input.value;
            }
        });

        // Checkbox ve radyo butonlarını manuel olarak işle
        const selectedVariationStatus = document.querySelector('input[name="variation-status"]:checked');
        if (selectedVariationStatus) {
            newSettings.variationStatus = selectedVariationStatus.value;
        }

        const singleVariationCheckbox = document.getElementById('single-variation-checkbox');
        if (singleVariationCheckbox) {
            newSettings.singleVariation = singleVariationCheckbox.checked;
        }

        const buyboxOutOfStockCheckbox = document.getElementById('buybox-out-of-stock-checkbox');
        if (buyboxOutOfStockCheckbox) {
            newSettings.buyboxOutOfStock = buyboxOutOfStockCheckbox.checked;
        }

        const amazonOutOfStockCheckbox = document.getElementById('amazon-out-of-stock-checkbox');
        if (amazonOutOfStockCheckbox) {
            newSettings.amazonOutOfStock = amazonOutOfStockCheckbox.checked;
        }

        const fbaOutOfStockCheckbox = document.getElementById('fba-out-of-stock-checkbox');
        if (fbaOutOfStockCheckbox) {
            newSettings.fbaOutOfStock = fbaOutOfStockCheckbox.checked;
        }

        const fbmOutOfStockCheckbox = document.getElementById('fbm-out-of-stock-checkbox');
        if (fbmOutOfStockCheckbox) {
            newSettings.fbmOutOfStock = fbmOutOfStockCheckbox.checked;
        }

        const newPriceOutOfStockCheckbox = document.getElementById('new-price-out-of-stock-checkbox');
        if (newPriceOutOfStockCheckbox) {
            newSettings.newPriceOutOfStock = newPriceOutOfStockCheckbox.checked;
        }

        // Ürün tipleri için checkbox'ları işle
        const selectedProductTypes = Array.from(document.querySelectorAll('.product-type-checkbox:checked')).map(cb => cb.value);
        newSettings.productTypes = selectedProductTypes;

        await chrome.storage.local.set({ keepaSettings: newSettings });
        alert('Ayarlar kaydedildi.');
    });

    function loadSettings() {
        return new Promise(resolve => {
            chrome.storage.local.get('keepaSettings', (data) => {
                const defaults = { asinCount: '100', variationStatus: 'all' };
                const savedSettings = data.keepaSettings || defaults;

                const toCamelCase = str => str.replace(/-([a-z])/g, g => g[1].toUpperCase());

                Object.keys(settingsInputs).forEach(kebabKey => {
                    const input = settingsInputs[kebabKey];
                    if (input) {
                        const camelCaseKey = toCamelCase(kebabKey);
                        // Use saved value, fallback to default, finally fallback to empty string
                        input.value = savedSettings[camelCaseKey] || defaults[camelCaseKey] || '';
                    }
                });

                // Radyo ve checkbox durumlarını yükle
                if (savedSettings.variationStatus) {
                    const variationRadio = document.querySelector(`input[name="variation-status"][value="${savedSettings.variationStatus}"]`);
                    if (variationRadio) variationRadio.checked = true;
                }
                
                const singleVariationCheckbox = document.getElementById('single-variation-checkbox');
                if (singleVariationCheckbox) {
                    singleVariationCheckbox.checked = savedSettings.singleVariation === true;
                }

                if (forceLiveSellerQueryCheckbox) {
                    forceLiveSellerQueryCheckbox.checked = savedSettings.forceLiveSellerQuery === true;
                }

                const buyboxOutOfStockCheckbox = document.getElementById('buybox-out-of-stock-checkbox');
                if (buyboxOutOfStockCheckbox) {
                    buyboxOutOfStockCheckbox.checked = savedSettings.buyboxOutOfStock === true;
                    handleCheckboxChange(buyboxOutOfStockCheckbox, 'min-buybox-price', 'max-buybox-price');
                }

                const amazonOutOfStockCheckbox = document.getElementById('amazon-out-of-stock-checkbox');
                if (amazonOutOfStockCheckbox) {
                    amazonOutOfStockCheckbox.checked = savedSettings.amazonOutOfStock === true;
                    handleCheckboxChange(amazonOutOfStockCheckbox, 'min-amazon-price', 'max-amazon-price');
                }

                const fbaOutOfStockCheckbox = document.getElementById('fba-out-of-stock-checkbox');
                if (fbaOutOfStockCheckbox) {
                    fbaOutOfStockCheckbox.checked = savedSettings.fbaOutOfStock === true;
                    handleCheckboxChange(fbaOutOfStockCheckbox, 'min-fba-price', 'max-fba-price');
                }

                const fbmOutOfStockCheckbox = document.getElementById('fbm-out-of-stock-checkbox');
                if (fbmOutOfStockCheckbox) {
                    fbmOutOfStockCheckbox.checked = savedSettings.fbmOutOfStock === true;
                    handleCheckboxChange(fbmOutOfStockCheckbox, 'min-fbm-price', 'max-fbm-price');
                }

                const newPriceOutOfStockCheckbox = document.getElementById('new-price-out-of-stock-checkbox');
                if (newPriceOutOfStockCheckbox) {
                    newPriceOutOfStockCheckbox.checked = savedSettings.newPriceOutOfStock === true;
                    handleCheckboxChange(newPriceOutOfStockCheckbox, 'min-new-price', 'max-new-price');
                }

                const productTypes = savedSettings.productTypes || [];
                document.querySelectorAll('.product-type-checkbox').forEach(cb => {
                    cb.checked = productTypes.includes(cb.value);
                });
                resolve();
            });
        });
    }

    function setupCheckboxHandler(checkboxId, minInputId, maxInputId) {
        const checkbox = document.getElementById(checkboxId);
        if (checkbox) {
            checkbox.addEventListener('change', () => handleCheckboxChange(checkbox, minInputId, maxInputId));
        }
    }

    function handleCheckboxChange(checkbox, minInputId, maxInputId) {
        const minInput = document.getElementById(minInputId);
        const maxInput = document.getElementById(maxInputId);

        if (!minInput || !maxInput) return;

        if (checkbox.checked) {
            minInput.disabled = true;
            maxInput.disabled = true;
            minInput.value = '';
            maxInput.value = '';
        } else {
            minInput.disabled = false;
            maxInput.disabled = false;
        }
    }

    setupCheckboxHandler('buybox-out-of-stock-checkbox', 'min-buybox-price', 'max-buybox-price');
    setupCheckboxHandler('amazon-out-of-stock-checkbox', 'min-amazon-price', 'max-amazon-price');
    setupCheckboxHandler('fba-out-of-stock-checkbox', 'min-fba-price', 'max-fba-price');
    setupCheckboxHandler('fbm-out-of-stock-checkbox', 'min-fbm-price', 'max-fbm-price');
    setupCheckboxHandler('new-price-out-of-stock-checkbox', 'min-new-price', 'max-new-price');

    // === GÖRÜNÜM YÖNETİCİSİ ===
    class ViewManager {
        constructor() {
            this.history = ['main']; // Başlangıç görünümü
        }

        showView(viewName, save = true) {
        Object.values(views).forEach(view => view.style.display = 'none');
        if (views[viewName]) {
            views[viewName].style.display = 'block';

                if (save) {
                    // Son görünümü kaydet
                    chrome.storage.local.set({ lastView: viewName });
                }

                // Görünüm değiştiğinde ilgili UI'ı render et
                if (viewName === 'categories') {
                    renderUI();
                } else if (viewName === 'sellerQuery') {
                    renderSellerUI();
                }
        } else {
                console.error(`View '${viewName}' not found.`);
                views.main.style.display = 'block'; // Hata durumunda ana menüye dön
            }
        }

        navigate(viewName) {
            this.history.push(viewName);
            this.showView(viewName);
        }

        goBack() {
            if (this.history.length > 1) {
                this.history.pop(); // Mevcut görünümü çıkar
                const previousView = this.history[this.history.length - 1];
                this.showView(previousView, false); // Geçmişi kaydetmeden göster
            } else {
                // Eğer geçmiş boşsa ana menüye dön
                this.history = ['main'];
                this.showView('main', false);
            }
        }
    }

    const viewManager = new ViewManager();

    // === TEST SORGUSU ===

    // Token sorgulama işlevi, hem input'tan hem de storage'dan okumayı deneyerek
    // başlangıçtaki "race condition" sorununu çözmek için ayrıldı.
    async function handleTokenCheck() {
        testQueryStatus.textContent = 'Sorgulanıyor...';
        testQueryStatus.style.display = 'block';
        testMultiColumnResultsContainer.style.display = 'none';
        testMultiColumnResultsContainer.innerHTML = '';
        startTestQueryBtn.disabled = true;

        try {
            // Önce arayüzdeki input'tan okumayı dene. En hızlı yöntem bu.
            let apiKey = settingsInputs.apiKey.value;

            // Eğer input boşsa (ayar yüklemesi bitmemiş olabilir), doğrudan storage'dan almayı dene.
            if (!apiKey) {
                console.log("API anahtarı input'u boş, storage kontrol ediliyor...");
                const data = await chrome.storage.local.get('keepaSettings');
                apiKey = data?.keepaSettings?.apiKey;
            }

            // Hala anahtar yoksa, hata göster.
            if (!apiKey) {
                throw new Error("Keepa API anahtarı bulunamadı. Lütfen Keepa Ayarları sayfasından anahtarınızı girin.");
            }

            const apiUrl = `https://api.keepa.com/token?key=${apiKey}`;
            console.log("TEST API URL (Token Sorgusu):", apiUrl);

            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP Hatası: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();

            if (data.error) {
                throw new Error(`Keepa API Hatası: ${data.error.message}`);
            }

            const tokensLeft = data.tokensLeft;
            testQueryStatus.innerHTML = `<h4>Sorgu Başarılı!</h4><p>Kalan Token Sayısı: <strong>${tokensLeft}</strong></p>`;

        } catch (error) {
            console.error("Token sorgusu hatası:", error);
            testQueryStatus.innerHTML = `<p style="color:red;">Hata: ${error.message}</p>`;
        } finally {
            startTestQueryBtn.disabled = false;
        }
    }

    startTestQueryBtn.addEventListener('click', handleTokenCheck);

    startUserUrlTestBtn.addEventListener('click', async () => {
        const userUrl = userUrlInput.value.trim();
        if (!userUrl) {
            alert("Lütfen URL alanını doldurun.");
            return;
        }
        if (!userUrl.includes("YOUR_API_KEY")) {
            alert("URL, 'YOUR_API_KEY' yer tutucusunu içermelidir.");
            return;
        }

        testQueryStatus.textContent = 'Sorgulanıyor...';
        testQueryStatus.style.display = 'block';
        testMultiColumnResultsContainer.style.display = 'none';
        testMultiColumnResultsContainer.innerHTML = '';
        startUserUrlTestBtn.disabled = true;

        const { keepaSettings } = await chrome.storage.local.get('keepaSettings');
        const apiKey = keepaSettings?.apiKey;
        if (!apiKey) {
            testQueryStatus.innerHTML = `<p style="color:red;">Hata: Keepa API anahtarı bulunamadı.</p>`;
            startUserUrlTestBtn.disabled = false;
            return;
        }

        try {
            // 1. URL'yi ayrıştır
            const urlObject = new URL(userUrl);
            const selectionParam = urlObject.searchParams.get('selection');
            if (!selectionParam) {
                throw new Error("URL'de 'selection' parametresi bulunamadı.");
            }

            // 2. Selection JSON'ını al ve değiştir
            let selectionJson = JSON.parse(decodeURIComponent(selectionParam));
            selectionJson.perPage = 5000;
            selectionJson.page = 0;

            // 3. Değiştirilmiş JSON'ı URL'ye geri koy (Tarayıcı kodlamayı yapsın)
            urlObject.searchParams.set('selection', JSON.stringify(selectionJson));
            urlObject.searchParams.set('key', apiKey); // API anahtarını ayarla

            // 4. Son URL'yi oluştur
            const finalUrl = urlObject.toString();
            
            // Tek bir istek gönder
            const response = await new Promise(resolve => {
                chrome.runtime.sendMessage({ action: 'keepa-query', url: finalUrl }, res => resolve(res));
            });

            if (!response || !response.success) {
                throw new Error(response?.error || 'Bilinmeyen bir hata oluştu.');
            }

            // Sonuçları işle ve render et
            const data = response.data;
            const asins = data.asinList || (data.products ? data.products.map(p => p.asin).filter(Boolean) : []);
            
            testQueryStatus.textContent = `Sorgu tamamlandı. ${asins.length} ASIN bulundu.`;
            testMultiColumnResultsContainer.style.display = 'block';

            if (asins.length > 0) {
                const column = document.createElement('div');
                column.className = 'result-column';
                const asinsAsText = asins.join('\\n');
                column.innerHTML = `
                    <div class="result-column-header">
                        <span>Sorgu Sonucu (${asins.length} ASIN)</span>
                        <button class="action-button copy-test-column-btn" data-asins="${asinsAsText}">Kopyala</button>
                    </div>
                    <div class="result-column-content">
                        ${asins.map(asin => `<a href="https://www.amazon.com/dp/${asin}" target="_blank" class="asin-link-item">${asin}</a>`).join('')}
                    </div>
                `;
                testMultiColumnResultsContainer.appendChild(column);
            } else {
                testMultiColumnResultsContainer.innerHTML = '<p style="text-align:center;color:#6b7280;">Bu sorgu için sonuç bulunamadı.</p>';
            }

        } catch (error) {
            console.error("Test sorgusu hatası:", error);
            testQueryStatus.innerHTML = `<p style="color:red;">Hata: ${error.message}</p>`;
        } finally {
            startUserUrlTestBtn.disabled = false;
        }
    });

    testMultiColumnResultsContainer.addEventListener('click', (e) => {
        if (e.target.matches('.copy-test-column-btn')) {
            const button = e.target;
            const textToCopy = button.dataset.asins.replace(/\\n/g, '\\n');
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = button.textContent;
                button.textContent = 'Kopyalandı!';
                setTimeout(() => { button.textContent = originalText; }, 2000);
            }).catch(err => {
                console.error('Kopyalama hatası:', err);
                alert('ASIN\'ler kopyalanamadı.');
            });
        }
    });

    // --- BAŞLANGIÇ FONKSİYONU ---
    async function initializeApp() {
        try {
            const data = await chrome.storage.local.get(['state', 'lastView']); // Hem state'i hem de son görünümü al
            if (data && data.state) {
                // Kayıtlı state'i yükle, yeni eklenen alanlar için varsayılan değerleri ata
                state = {
                    ...{ categoryLists: {}, activeList: null, sellerLists: {}, activeSellerList: null }, // Varsayılan yapı
                    ...data.state 
                };
            } else {
                // Başlangıç state'i, eğer storage boşsa
                state = {
                    categoryLists: {},
                    activeList: null,
                    sellerLists: {},
                    activeSellerList: null,
                };
            }
            
            // Eğer hiç kategori listesi yoksa ve eski yapıdan gelen veri varsa diye kontrol
            if (state.categoryLists && Object.keys(state.categoryLists).length > 0 && !state.activeList) {
                state.activeList = Object.keys(state.categoryLists)[0];
            }
            // Eğer hiç satıcı listesi yoksa ve eski yapıdan gelen veri varsa diye kontrol
            if (state.sellerLists && Object.keys(state.sellerLists).length > 0 && !state.activeSellerList) {
                state.activeSellerList = Object.keys(state.sellerLists)[0];
            }

        populateSelects();
        await loadSettings();
            
            // Son kalınan görünümü yükle, yoksa ana menüyü göster
            const initialView = data.lastView || 'main';
            viewManager.showView(initialView, false); // Kaydetme döngüsünü engellemek için 'false'

        updateButtonState();

            // Checkbox'ları ve işlevlerini ayarla
            setupCheckboxHandler('buybox-out-of-stock-checkbox', 'min-buybox-price', 'max-buybox-price');
            setupCheckboxHandler('amazon-out-of-stock-checkbox', 'min-amazon-price', 'max-amazon-price');
            setupCheckboxHandler('fba-out-of-stock-checkbox', 'min-fba-price', 'max-fba-price');
            setupCheckboxHandler('fbm-out-of-stock-checkbox', 'min-fbm-price', 'max-fbm-price');
            setupCheckboxHandler('new-price-out-of-stock-checkbox', 'min-new-price', 'max-new-price');

        } catch (error) {
            console.error("Uygulama başlatılırken bir hata oluştu:", error);
            // Hata durumunda kullanıcıya bilgi verilebilir.
        }
    }

    // initializeApp(); // BU SATIR SİLİNECEK VEYA YORUMA ALINACAK

    // --- Satıcı Sorgulama Görünümü için Render Fonksiyonları ---
    const renderSellerUI = () => {
        renderSellerTabs();
        renderSellers();
        renderSellerResults();
        // TODO: Sorgulama ve sonuç butonlarının durumunu yönet
    };

    function renderSellerTabs() {
        if (!sellerTabsContainer) return;
        sellerTabsContainer.innerHTML = '';
        Object.keys(state.sellerLists).forEach(listName => {
            const tab = document.createElement('button');
            tab.className = 'tab-button';
            tab.textContent = listName;
            tab.dataset.listName = listName;
            if (listName === state.activeSellerList) tab.classList.add('active');

            const deleteBtn = document.createElement('span');
            deleteBtn.className = 'delete-tab-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.title = `'${listName}' listesini sil`;
            deleteBtn.dataset.listName = listName;
            tab.appendChild(deleteBtn);

            sellerTabsContainer.appendChild(tab);
        });
    }

    function renderSellers() {
        if (!sellerListContainer) return;
        if (!state.activeSellerList) {
            sellerListContainer.innerHTML = `<p style="text-align:center;color:#6b7280;padding:20px 0;">Başlamak için yeni bir satıcı listesi oluşturun.</p>`;
            return;
        }

        const listObject = state.sellerLists[state.activeSellerList];
        if (!listObject || !listObject.sellers || listObject.sellers.length === 0) {
            sellerListContainer.innerHTML = `<p style="text-align:center;color:#6b7280;padding:20px 0;">Bu listede henüz satıcı yok. "Aktif Satıcıyı Ekle" butonu ile başlayabilirsiniz.</p>`;
            return;
        }

        const sellers = listObject.sellers;
        sellerListContainer.innerHTML = ''; // Konteyneri temizle

        sellers.forEach((seller, index) => {
            const item = document.createElement('div');
            item.className = 'category-item'; // Kategori ile aynı stili kullanıyoruz
            item.dataset.id = seller.id;

            // domainId'yi metin karşılığına çevir
            const domainTld = Object.keys(domainMap).find(key => domainMap[key] === seller.domainId) || '??';

            item.innerHTML = `
                <input type="checkbox" class="seller-select" ${seller.selected ? 'checked' : ''}>
                <span class="category-number">${index + 1}.</span>
                <a href="#" class="seller-link" title="URL: ${seller.url} | Satıcı sayfasını yeni sekmede aç">${seller.id}</a>
                <span class="domain-badge">${domainTld.replace('com.','')}</span>
                <input type="text" class="seller-note" placeholder="Not..." value="${seller.note || ''}">
                <button class="delete-seller-btn" title="Satıcıyı sil">🗑️</button>
            `;
            sellerListContainer.appendChild(item);
        });
    }

    function renderSellerResults() {
        if (!sellerResultsContainer || !state.activeSellerList) return;

        const listObject = state.sellerLists[state.activeSellerList];
        const results = listObject.results || [];

        if (results.length === 0) {
            sellerResultsSection.style.display = 'none';
                return;
            }

        // Sorgu sonrası butonlar hemen görünür olsun ama sonuçlar gizli kalsın.
        // Kullanıcı toggle butonuna basınca kolonlar görünür/gizlenir.
        sellerResultsSection.style.display = 'block'; 
        sellerResultsContainer.innerHTML = ''; // Temizle

        results.forEach(result => {
            const column = document.createElement('div');
            column.className = 'result-column';
            column.dataset.sellerId = result.sellerId;

            const isShuffled = result.sellerId === 'shuffled';
            const sellerNameHtml = isShuffled 
                ? `<div class="seller-name">${result.sellerRowNumber} ${result.sellerName}</div>`
                : `<div class="seller-name">${result.sellerRowNumber}. ${result.sellerName}</div>`;

            column.innerHTML = `
                <div class="result-column-header">
                    ${sellerNameHtml}
                    <div class="asin-count">${result.asinCount} ASIN</div>
                    <button class="action-button copy-seller-column-btn" data-seller-id="${result.sellerId}">Kopyala</button>
                    <button class="delete-result-column-btn" title="Bu sonucu sil">&times;</button>
                </div>
                <div class="result-column-content">
                    ${result.asins.map(asin => `<a href="https://www.amazon.com/dp/${asin}" target="_blank" class="asin-link-item">${asin}</a>`).join('')}
                </div>
            `;
            sellerResultsContainer.appendChild(column);
        });

        // Butonların durumunu güncelle
        const hasResults = results.length > 0;
        const isContainerVisible = sellerResultsContainer.style.display !== 'none';
        
        toggleSellerResultsBtn.textContent = isContainerVisible ? 'Sonuçları Gizle' : 'Sonuçları Göster';
        shuffleSellerAsinsBtn.disabled = results.filter(r => r.sellerId !== 'shuffled').length < 2;
        copyAllSellerAsinsBtn.disabled = !hasResults;
        deleteAllSellerResultsBtn.disabled = !hasResults;
    }

    // Satıcı Listesi Konteyner Dinleyicisi
    if (sellerListContainer) {
        sellerListContainer.addEventListener('click', async (e) => {
            const target = e.target;
            const itemElement = target.closest('.category-item');
            if (!itemElement) return;

            const sellerId = itemElement.dataset.id;
            if (!sellerId || !state.activeSellerList || !state.sellerLists[state.activeSellerList]) return;

            const list = state.sellerLists[state.activeSellerList].sellers;
            const seller = list.find(s => s.id === sellerId);
            if (!seller) return;

            if (target.classList.contains('delete-seller-btn')) {
                state.sellerLists[state.activeSellerList].sellers = list.filter(s => s.id !== sellerId);
                await saveState();
                renderSellers();
            } else if (target.classList.contains('seller-select')) {
                seller.selected = target.checked;
                await saveState();
            } else if (target.classList.contains('seller-link')) {
                e.preventDefault();
                chrome.tabs.create({ url: seller.url });
            }
        });

        sellerListContainer.addEventListener('input', async (e) => {
            const target = e.target;
            const itemElement = target.closest('.category-item');
            if (!itemElement) return;
            
            const sellerId = itemElement.dataset.id;
            if (target.classList.contains('seller-note') && sellerId) {
                const seller = state.sellerLists[state.activeSellerList].sellers.find(s => s.id === sellerId);
                if (seller) {
                    seller.note = target.value;
                    await saveState();
                }
            }
        });
    }

    // Sekme Konteyner Dinleyicisi (Satıcı)
    if (sellerTabsContainer) {
        sellerTabsContainer.addEventListener('click', async (e) => {
            const target = e.target;
            const listName = target.closest('[data-list-name]')?.dataset.listName;

            if (!listName) return;

            if (target.classList.contains('delete-tab-btn')) {
                e.stopPropagation(); // Ana sekme tıklama olayını engelle
                if (confirm(`'${listName}' satıcı listesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
                    delete state.sellerLists[listName];
                    if (state.activeSellerList === listName) {
                        state.activeSellerList = Object.keys(state.sellerLists)[0] || null;
                    }
                    await saveState();
                    renderSellerUI();
                }
        } else {
                state.activeSellerList = listName;
                await saveState();
                renderSellerUI();
            }
        });
    }

    // --- Satıcı Sorgulama Olay Dinleyicileri ---

    querySellersBtn.addEventListener('click', async () => {
        // 1. Ön Kontroller
        const { keepaSettings } = await chrome.storage.local.get('keepaSettings');
        if (!keepaSettings || !keepaSettings.apiKey) {
            alert('Lütfen Ayarlar bölümünden Keepa API anahtarınızı girin.');
            viewManager.navigate('settings');
                return;
            }

        if (!state.activeSellerList || !state.sellerLists[state.activeSellerList]) {
            alert('Lütfen önce bir satıcı listesi oluşturun veya seçin.');
                return;
            }

        const listObject = state.sellerLists[state.activeSellerList];
        const selectedSellers = listObject.sellers.filter(s => s.selected);

        if (selectedSellers.length === 0) {
            alert('Lütfen sorgulamak için en az bir satıcı seçin.');
            return;
        }

        if ((listObject.results?.length || 0) + selectedSellers.length > 10) {
            alert('Toplam sonuç sayısı 10\'u aşamaz. Mevcut sonuç sayısı: ' + (listObject.results?.length || 0) + '. Lütfen bazı sonuçları silin veya daha az satıcı seçin.');
                 return;
            }

        // 2. API İsteklerini Hazırlama
        sellerQueryStatus.textContent = 'Sorgulanıyor...';
        sellerQueryStatus.style.display = 'block';
        querySellersBtn.disabled = true;

        const promises = selectedSellers.map(seller => {
            let url = `https://api.keepa.com/seller?key=${keepaSettings.apiKey}&domain=${seller.domainId}&seller=${seller.id}&storefront=1`;
            
            // Eğer "Canlı Veri Zorla" kutusu işaretliyse, update=0 parametresini ekle
            if (forceLiveSellerQueryCheckbox && forceLiveSellerQueryCheckbox.checked) {
                url += '&update=0';
            }

            return new Promise((resolve) => {
                chrome.runtime.sendMessage({ action: 'keepa-query', url }, response => {
                    // Her bir sorgu sonucuna seller bilgisini de ekleyerek resolve et
                    resolve({ success: response.success, data: response.data, seller: seller });
                });
            });
        });

        // 3. İstekleri Gönderme ve Sonuçları İşleme
        const responses = await Promise.all(promises);

        let newResultsCount = 0;
        const errors = [];

        responses.forEach(res => {
            const sellerInfo = res.seller;
            // API'den gelen cevabı doğru şekilde ayrıştır
            const sellerData = res.data.sellers?.[sellerInfo.id];

            if (res.success && sellerData) {
                // Eğer state'de sonuç dizisi yoksa oluştur
                if (!listObject.results) {
                    listObject.results = [];
                }

                // Gelen sonuçtan satıcı adını alıp state'i güncelle (eğer varsa)
                if (sellerData.sellerName && sellerInfo.name !== sellerData.sellerName) {
                    const sellerInState = listObject.sellers.find(s => s.id === sellerInfo.id);
                    if(sellerInState) sellerInState.name = sellerData.sellerName;
                }

                const sellerRowNumber = listObject.sellers.findIndex(s => s.id === sellerInfo.id) + 1;

                listObject.results.push({
                    sellerId: sellerInfo.id,
                    sellerName: sellerData.sellerName || sellerInfo.name,
                    sellerRowNumber: sellerRowNumber,
                    asins: sellerData.asinList || [],
                    asinCount: sellerData.asinList?.length || 0
                });
                newResultsCount++;
            } else {
                const errorMessage = res.data?.error?.message || 'Satıcı bulunamadı veya bir API hatası oluştu.';
                errors.push(`${sellerInfo.id}: ${errorMessage}`);
            }
        });
        
        // 4. Arayüzü Güncelle
        sellerQueryStatus.textContent = `${newResultsCount} satıcı sorgulandı. ${errors.length > 0 ? `Hatalar: ${errors.join(', ')}` : ''}`;
        
        querySellersBtn.disabled = false;
        
        if (newResultsCount > 0) {
            sellerResultsContainer.style.display = 'flex'; // Sorgudan sonra sonuçları direkt göster
        }

        await saveState();
        renderSellerUI(); // Her şeyi yeniden çiz
    });

    deleteAllSellerResultsBtn.addEventListener('click', async () => {
        if (!state.activeSellerList) return;
        const listObject = state.sellerLists[state.activeSellerList];
        if (!listObject.results || listObject.results.length === 0) return;

        if (confirm("Bu listedeki tüm sonuçları ve karıştırılmış listeyi silmek istediğinizden emin misiniz?")) {
            listObject.results = [];
            await saveState();
            renderSellerUI();
        }
    });

    copyAllSellerAsinsBtn.addEventListener('click', () => {
        if (!state.activeSellerList) return;
        const results = state.sellerLists[state.activeSellerList].results || [];
        if (results.length === 0) return;

        const allAsins = results.flatMap(res => res.asins);
        const uniqueAsins = [...new Set(allAsins)];
        
        if (uniqueAsins.length > 0) {
            navigator.clipboard.writeText(uniqueAsins.join('\n')).then(() => {
                alert(`${uniqueAsins.length} benzersiz ASIN panoya kopyalandı!`);
            }).catch(err => {
                console.error('Kopyalama hatası:', err);
                alert('ASIN\'ler kopyalanamadı.');
            });
        }
    });

    shuffleSellerAsinsBtn.addEventListener('click', async () => {
        if (!state.activeSellerList) return;
        const listObject = state.sellerLists[state.activeSellerList];
        const results = listObject.results || [];

        if (results.length < 2) {
            alert('ASIN\'leri karıştırmak için en az 2 sonuç kolonu olmalıdır.');
            return;
        }

        // Mevcut karışık listeyi kaldır
        listObject.results = listObject.results.filter(r => r.sellerId !== 'shuffled');

        const allAsins = listObject.results.flatMap(res => res.asins);
        let uniqueAsins = [...new Set(allAsins)];

        // Fisher-Yates Shuffle
        for (let i = uniqueAsins.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [uniqueAsins[i], uniqueAsins[j]] = [uniqueAsins[j], uniqueAsins[i]];
        }

        listObject.results.push({
            sellerId: 'shuffled',
            sellerName: 'Karışık Liste',
            sellerRowNumber: '🎲',
            asins: uniqueAsins,
            asinCount: uniqueAsins.length
        });

        await saveState();
        renderSellerUI();
    });

    sellerResultsContainer.addEventListener('click', async (e) => {
        const target = e.target;

        if (target.classList.contains('delete-result-column-btn')) {
            const column = target.closest('.result-column');
            const sellerIdToDelete = column.dataset.sellerId;

            if (!state.activeSellerList || !sellerIdToDelete) return;
            
            const listObject = state.sellerLists[state.activeSellerList];
            listObject.results = listObject.results.filter(r => r.sellerId !== sellerIdToDelete);
            
            await saveState();
            renderSellerUI();
        }

        if (target.classList.contains('copy-seller-column-btn')) {
            const button = target;
            const sellerId = button.dataset.sellerId;
            if (!state.activeSellerList || !sellerId) return;

            const results = state.sellerLists[state.activeSellerList].results || [];
            const resultToCopy = results.find(r => r.sellerId === sellerId);

            if (resultToCopy && resultToCopy.asins.length > 0) {
                navigator.clipboard.writeText(resultToCopy.asins.join('\n')).then(() => {
                    const originalText = button.textContent;
                    button.textContent = 'Kopyalandı!';
                    setTimeout(() => { button.textContent = originalText; }, 2000);
                }).catch(err => {
                    console.error('Kopyalama hatası:', err);
                    alert('ASIN\'ler kopyalanamadı.');
                });
            }
        }
    });

    toggleSellerResultsBtn.addEventListener('click', () => {
        const isVisible = sellerResultsContainer.style.display !== 'none';
        sellerResultsContainer.style.display = isVisible ? 'none' : 'flex';
        toggleSellerResultsBtn.textContent = isVisible ? 'Sonuçları Göster' : 'Sonuçları Gizle';
    });

    // Tüm Geri butonlarına tıklama olayı ekle
    backButtons.forEach(button => {
        button.addEventListener('click', () => {
            const currentView = document.querySelector('.view.active');
            if (currentView.id === 'results-view') {
                // Eğer sonuç sayfasındaysak, kategori sorgulama sayfasına dön
                viewManager.navigate('categories');
            } else {
                // Diğer sayfalarda ana menüye dön
                viewManager.navigate('main');
            }
        });
    });

    // Sayfa yüklendiğinde son görünümü geri yükle ve uygulamayı başlat
    initializeApp();

    if (forceLiveSellerQueryCheckbox) {
        forceLiveSellerQueryCheckbox.addEventListener('change', async (e) => {
            const { keepaSettings } = await chrome.storage.local.get('keepaSettings');
            const newSettings = keepaSettings || {};
            newSettings.forceLiveSellerQuery = e.target.checked;
            await chrome.storage.local.set({ keepaSettings: newSettings });
        });
    }

    // Aktif Kategoriyi Ekle Butonu
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', async () => {
            // Adım 1: Aktif bir liste olup olmadığını kontrol et.
            if (!state.activeList) {
                // Eğer liste yoksa, yeni bir tane oluşturulmasını iste.
                const listName = promptForNewListName(state.categoryLists, 'İlk kategori listenizi oluşturmak için bir ad girin:');
                if (!listName) return; // Kullanıcı iptal etti.

                state.categoryLists[listName] = { categories: [], results: [] };
                state.activeList = listName;
                // UI render ve saveState en sonda yapılacak.
            }

            // Adım 2: Aktif listeyi al ve kategori sayısını kontrol et.
            const activeListObject = state.categoryLists[state.activeList];
            if (activeListObject.categories.length >= 20) {
                alert('Bir listeye en fazla 20 kategori ekleyebilirsiniz. Lütfen yeni bir kategori eklemek için mevcut olanlardan birini silin.');
                return; // Fonksiyondan çık.
            }

            // Adım 3: Aktif sekmeden kategori bilgilerini al.
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!tab || !tab.url || !tab.url.includes('amazon.')) {
                    alert('Lütfen bir Amazon kategori sayfasındayken tekrar deneyin.');
                    return;
                }

                const url = new URL(tab.url);
                const categoryId = url.searchParams.get('node');
                const domainId = getDomainIdFromUrl(tab.url);

                if (!categoryId) {
                    alert("Bu URL'de bir kategori ID ('node=') bulunamadı.");
                    return;
                }

                if (!domainId) {
                    alert("Bu Amazon pazar yeri desteklenmiyor veya URL'den pazar yeri bilgisi alınamadı.");
                    return;
                }

                // Kategori adını sayfa başlığından al
                const categoryName = parseCategoryName(tab.title, tab.url);

                // Adım 4: Kategorinin listede olup olmadığını kontrol et.
                if (activeListObject.categories.some(c => c.id === categoryId)) {
                    alert('Bu kategori bu listede zaten mevcut.');
                    return;
                }

                // Adım 5: Önce tüm kategorilerin seçimini kaldır
                activeListObject.categories.forEach(cat => cat.selected = false);

                // Adım 6: Yeni kategoriyi ekle (sadece bu seçili olacak)
                const newCategory = {
                    id: categoryId,
                    name: categoryName,
                    url: tab.url,
                    note: '',
                    selected: true // Sadece yeni eklenen kategori seçili
                };

                activeListObject.categories.push(newCategory);

            } catch (error) {
                console.error("Kategori bilgileri alınırken hata oluştu:", error);
                alert("Geçerli bir Amazon URL'si bulunamadı veya bir hata oluştu.");
            }
            
            // Adım 7: Değişiklikleri kaydet ve arayüzü güncelle.
            await saveState();
            renderUI();
        });
    }

    deleteResultsBtn.addEventListener('click', async () => {
        if (state.activeList && confirm("Bu listedeki tüm sonuçları silmek istediğinizden emin misiniz?")) {
            const listObject = state.categoryLists[state.activeList];
            listObject.results = [];
            await saveState();
            multiColumnResultsContainer.innerHTML = ''; // Görünen sonuçları temizle
            resultControlsContainer.style.display = 'none'; // Butonları gizle
            queryStatus.textContent = 'Tüm sonuçlar silindi.';
            setTimeout(() => { queryStatus.style.display = 'none'; }, 2000);
        }
    });
}); // DOMContentLoaded sonu