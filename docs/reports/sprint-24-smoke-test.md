# Sprint 24: Production Smoke Test

## Overview
This document contains the results of the production smoke test for DublajLab across Vercel (Frontend) and Railway (Backend).

## Test Results

| # | Check Item | Status | Notes |
|---|---|---|---|
| 1 | Vercel frontend açılıyor mu? | ⚠️ **BLOCKED** | Vercel projesinde "Vercel Authentication / SSO" koruması aktif. Ziyaretçiler direkt olarak Vercel Login sayfasına yönlendiriliyor. Bu ayarın Vercel paneli üzerinden "Vercel Protection" altından kapatılması gerekiyor. |
| 2 | Railway backend `/api/health` dönüyor mu? | ✅ **PASS** | `https://backend-production-c956d.up.railway.app/api/health` HTTP 200 OK yanıtı veriyor (`{"status":"ok","app":"DublajLab","version":"0.2.0"}`). |
| 3 | CORS canlı frontend domainiyle çalışıyor mu? | ⚠️ **BLOCKED** | Frontend korumalı olduğu için E2E testi yapılamadı. |
| 4 | Register çalışıyor mu? | ⚠️ **BLOCKED** | Frontend erişimi yok. |
| 5 | Login/logout çalışıyor mu? | ⚠️ **BLOCKED** | Frontend erişimi yok. |
| 6 | `/me` session restore çalışıyor mu? | ⚠️ **BLOCKED** | Frontend erişimi yok. |
| 7 | Template listesi geliyor mu? | ⚠️ **BLOCKED** | Frontend erişimi yok. |
| 8 | Video upload çalışıyor mu? | ⚠️ **BLOCKED** | Frontend erişimi yok. |
| 9 | Export job kuyruğa giriyor mu? | ⚠️ **BLOCKED** | Frontend erişimi yok. |
| 10 | Export sonucu preview/download veriyor mu? | ⚠️ **BLOCKED** | Frontend erişimi yok. |
| 11 | Login olan kullanıcının export’u Kataloğum’a düşüyor mu? | ⚠️ **BLOCKED** | Frontend erişimi yok. |
| 12 | Public/private toggle çalışıyor mu? | ⚠️ **BLOCKED** | Frontend erişimi yok. |
| 13 | Dublajlar feed’i public içerikleri gösteriyor mu? | ⚠️ **BLOCKED** | Frontend erişimi yok. |
| 14 | Like/view çalışıyor mu? | ⚠️ **BLOCKED** | Frontend erişimi yok. |
| 15 | Comment ekleme/silme çalışıyor mu? | ⚠️ **BLOCKED** | Frontend erişimi yok. |
| 16 | Report/moderation akışı çalışıyor mu? | ⚠️ **BLOCKED** | Frontend erişimi yok. |
| 17 | Admin panel erişimi doğru korunuyor mu? | ⚠️ **BLOCKED** | Frontend erişimi yok. |
| 18 | Membership/Shopier yönlendirmesi çalışıyor mu? | ⚠️ **BLOCKED** | Frontend erişimi yok. |
| 19 | Discord linki doğru mu? | ⚠️ **BLOCKED** | Frontend erişimi yok. |
| 20 | Hesap silme canlıda çalışıyor mu? | ⚠️ **BLOCKED** | Frontend erişimi yok. |
| 21 | SPA route refresh testi (`/membership` vb. 404 vermiyor mu?) | 🔄 **FIXED** | Kök URL `dublajlab.vercel.app/membership` 404 veriyordu. Bunun sebebi Vercel'in `frontend/vercel.json` dosyasını kök dizinde bulamamasıydı. `vercel.json` kök dizine de kopyalandı ve commitlendi. |

## Actions Taken
1. **SPA Route Fix**: Kök dizinde (root) `vercel.json` eksik olduğu için direkt alt sayfalara girişte 404 alınıyordu. `frontend/vercel.json` dosyası kök dizine kopyalanarak sorun çözüldü ve commit'lendi.
2. **Backend API Health Check**: Railway backend'in canlıda başarıyla çalıştığı ve sağlıklı (health=ok) olduğu tespit edildi.
3. **Vercel Auth Blocker**: Vercel frontend uygulamasının (preview ve production) Vercel kurumsal kimlik doğrulamasına (Vercel Authentication/Protected Deployment) takıldığı tespit edildi. Bu sebepten otomatize smoke testlerin UI adımları bloklanmıştır. Kullanıcının Vercel panelinden "Vercel Protection" ayarını devredışı bırakması tavsiye edilir.
