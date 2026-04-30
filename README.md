# Veri Yapıları ile BSP Ağacı Tabanlı Görüş Alanı ve Çarpışma Tespiti
Bu projede, kuşbakışı (top-down) oynanan 2 boyutlu bir gizlilik oyunu sadeleştirilmiş bir model üzerinden geliştirilecektir. Oyuncu, duvarlar ve engeller içeren bir haritada hareket ederek hedef noktaya ulaşmaya çalışırken, haritada devriye gezen düşmanlara yakalanmamaya çalışacaktır.

# Görev Listesi

### Enes Çelik 
- BSP tree build
- segment split
- classify point
- BSP traversal
- Bu aşamada projenin temel veri yapısı olan Binary Space Partitioning (BSP) Tree mimarisi tamamen kurgulanmış ve işlevsel hale getirilmiştir. Yapılan çalışmalar     şunlardır:
  
  1) **BSP Tree Build (Ağaç Kurulumu)**: Rastgele sıralanmış duvar segmentlerini hiyerarşik bir düzene sokan rekürsif buildTree algoritması geliştirilmiştir. Bu sayede oyun evreni, sorguların O(log n) karmaşıklığında yapılabilmesi için optimize edilmiştir.
  2) **Segment Split (Duvar Bölme)**: Bir duvar segmentinin başka bir ayırıcı doğru tarafından kesilmesi durumunda, segmentin matematiksel olarak ikiye bölünmesini sağlayan splitSegment fonksiyonu yazılmıştır. Bu işlem sırasında kesişim noktaları hassas bir şekilde hesaplanarak veri bütünlüğü korunmuştur.
  3) **Classify Point (Nokta Sınıflandırma)**: Vektörel çarpım (cross product) metodu kullanılarak, bir noktanın veya segmentin ayırıcı çizgiye göre konumunu (FRONT, BACK, ON_LINE) belirleyen classifyPoint fonksiyonu implement edilmiştir.
  4) **BSP Traversal (Ağaç Gezinme)**: Bir noktanın veya ışının ağaç üzerindeki hangi yaprak düğümde (leaf node) olduğunu saptayan ve Eren’in Raycasting sistemi için temel teşkil eden gezinme algoritmaları (findLeaf, _traverse) tamamlanmıştır.
### ⚠   Karşılaşılan Sorunlar ve Çözümler
  - **Hassasiyet Kaybı**: Geometrik hesaplamalarda JavaScript'in kayan nokta (floating point) hataları nedeniyle segmentlerin yanlış bölgelere atandığı fark edilmiştir. Bu sorun, tüm karşılaştırma işlemlerine 0.00001 (Epsilon) tolerans payı eklenerek çözülmüş ve sistemin kararlılığı artırılmıştır.

### Eren
- ray casting
- ray–segment intersection
- visibility polygon
- shadow

### Meltem
- grid/waypoint graph
- A* implementasyonu
- düşman hareketi

### Recep
- player-wall collision
- enemy-wall collision
- circle vs segment
- movement constraints

### Oğuzhan
- game loop
- input (keyboard)
- canvas çizim
- entity yönetimi
