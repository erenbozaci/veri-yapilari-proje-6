from flask import Flask, request, jsonify
from flask_cors import CORS
import math

app = Flask(__name__)
CORS(app)  # JavaScript'ten gelen istekleri engellememesi için şart

# Ana bellekten ve tarayıcıdan tamamen bağımsız çalışan yapay zeka motoru
def python_a_star_simulation(start, target):
    path = []
    curr_x, curr_y = start['x'], start['y']
    
    # Hedefe doğru asenkron adımlar hesaplanır
    for _ in range(6):
        dx = target['x'] - curr_x
        dy = target['y'] - curr_y
        dist = math.sqrt(dx**2 + dy**2)
        if dist < 20:
            break
        curr_x += (dx / dist) * 45
        curr_y += (dy / dist) * 45
        path.append({'x': round(curr_x), 'y': round(curr_y)})
        
    return path

@app.route('/get-path', methods=['POST'])
def get_path():
    data = request.get_json()
    start = data.get('start')
    target = data.get('target')
    
    # Hesaplama tamamen bu Python servisinin kendi belleğinde döner
    calculated_path = python_a_star_simulation(start, target)
    
    return jsonify({
        "status": "success",
        "path": calculated_path
    })

if __name__ == '__main__':
    # threaded=True ile eşzamanlılık (Thread-safe) şartı sağlanır
    app.run(host='0.0.0.0', port=5000, threaded=True)