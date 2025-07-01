document.addEventListener('DOMContentLoaded', function() {
    const saveButton = document.getElementById('save-btn');
    const urlInput = document.getElementById('web-app-url');
    const statusDiv = document.getElementById('status');

    // Sayfa yüklendiğinde kayıtlı URL'yi yükle
    chrome.storage.sync.get(['webAppUrl'], function(result) {
        if (result.webAppUrl) {
            urlInput.value = result.webAppUrl;
        }
    });

    // Kaydet butonuna tıklandığında
    saveButton.addEventListener('click', function() {
        const url = urlInput.value.trim();
        
        // URL'nin geçerli bir formatta olup olmadığını basitçe kontrol et
        if (url && url.startsWith('https://script.google.com/macros/s/')) {
            chrome.storage.sync.set({ webAppUrl: url }, function() {
                // Başarılı kaydetme mesajı
                statusDiv.textContent = 'Ayarlar başarıyla kaydedildi!';
                statusDiv.style.color = '#28a745';

                // Mesajı 2 saniye sonra temizle
                setTimeout(function() {
                    statusDiv.textContent = '';
                }, 2000);
            });
        } else {
            // Hata mesajı
            statusDiv.textContent = 'Lütfen geçerli bir Web App URL\'si girin.';
            statusDiv.style.color = '#dc3545';
        }
    });
}); 