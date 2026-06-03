
from flask import Flask, request, jsonify
from flask_cors import CORS
import math

app = Flask(__name__)
CORS(app)  # JavaScript'ten gelen istekleri engellememesi için şart

# Enes Çelik - Ana bellekten ve tarayıcıdan tamamen bağımsız çalışan yapay zeka motoru
def python_a_star_simulation_enes_celik(start_pos, target_pos):
    path_list = []
    curr_x, curr_y = start_pos['x'], start_pos['y']
    
    # Hedefe doğru asenkron adımlar hesaplanır
    for _ in range(6):
        dx = target_pos['x'] - curr_x
        dy = target_pos['y'] - curr_y
        dist = math.sqrt(dx**2 + dy**2)
        if dist < 20:
            break
        curr_x += (dx / dist) * 45
        curr_y += (dy / dist) * 45
        path_list.append({'x': round(curr_x), 'y': round(curr_y)})
        
    return path_list

@app.route('/get-path', methods=['POST'])
def get_path_enes_celik():
    data = request.get_json()
    start = data.get('start')
    target = data.get('target')
    
    # Hesaplama tamamen bu Python servisinin kendi belleğinde döner
    calculated_path = python_a_star_simulation_enes_celik(start, target)
    
    return jsonify({
        "status": "success",
        "path": calculated_path
    })

if __name__ == '__main__':
    # threaded=True ile eşzamanlılık (Thread-safe) şartı sağlanır
    app.run(host='0.0.0.0', port=5000, threaded=True)