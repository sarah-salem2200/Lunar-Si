import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

# 1. توليد بيانات تدريب محاكية لمعايير الهبوط الفضائي (5000 عينة)
np.random.seed(42)
n_samples = 5000

# المدخلات الـ 5 (Features):
# [slope (deg), elevation (m), illumination (hrs), earth_los (%), water_ice_dist (km)]
slope = np.random.uniform(0, 35, n_samples)
elevation = np.random.uniform(-4000, 4000, n_samples)
illumination = np.random.uniform(0, 24, n_samples)
earth_los = np.random.uniform(20, 100, n_samples)
water_ice = np.random.uniform(0.5, 30, n_samples)

X = np.column_stack([slope, elevation, illumination, earth_los, water_ice]).astype(np.float32)

# 2. صياغة دالة التقييم الفيزيائية/الهندسية ليتعلم الموديل أنماطها غير الخطية
# - الميل فوق 15 درجة يقلل الأمان بشدة (خطر انقلاب المركبة)
slope_penalty = np.where(slope <= 15, slope * 1.2, 18 + (slope - 15) * 3.8)
# - الإضاءة العالية ترفع الأمان (توليد الطاقة والتدفئة)
illum_bonus = (illumination / 24.0) * 25.0
# - الاتصال بالأرض ضروري للتحكم
comms_bonus = (earth_los / 100.0) * 15.0
# - القرب من الجليد المائي ميزة لمهمات الاستكشاف
ice_bonus = np.clip(10.0 - (water_ice * 0.3), 0, 10)
# - المرتفعات المعتدلة أفضل من قاع الحفر العميقة
elev_factor = np.clip((elevation + 2000) / 6000.0 * 10.0, 0, 10)

y = 55.0 - slope_penalty + illum_bonus + comms_bonus + ice_bonus + elev_factor
# إضافة ضوضاء طبيعية بسيطة لمحاكاة البيانات الواقعية
y += np.random.normal(0, 1.5, n_samples)
y = np.clip(y, 5, 99).astype(np.float32)

# 3. تدريب الموديل (Gradient Boosting)
model = GradientBoostingRegressor(n_estimators=120, max_depth=4, learning_rate=0.08, random_state=42)
model.fit(X, y)

# 4. تصدير الموديل بصيغة ONNX خفيفة وسريعة
initial_type = [('float_input', FloatTensorType([None, 5]))]
onnx_model = convert_sklearn(model, initial_types=initial_type, target_opset=12)

output_filename = "lunar_safety_model.onnx"
with open(output_filename, "wb") as f:
    f.write(onnx_model.SerializeToString())

print(f"✅ تم تدريب الموديل وتصديره بنجاح إلى: {output_filename}")