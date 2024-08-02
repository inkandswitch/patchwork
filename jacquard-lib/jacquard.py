import os
import json

def get_run_result_path():
    if not os.path.exists(".jacquard"):
        os.makedirs(".jacquard")
    return '.jacquard/runDependencies.json'

def initialize_run_result_file(path):
    if not os.path.exists(path):
        with open(path, 'w') as file:
            json.dump({"inputs": [], "outputs": []}, file)

def update_run_result_file(key, path):
    run_result_path = get_run_result_path()
    initialize_run_result_file(run_result_path)
    
    with open(run_result_path, 'r+') as file:
        data = json.load(file)
        if path not in data[key]:
            data[key].append(path)
            file.seek(0)
            json.dump(data, file, indent=2)
            file.truncate()

def declare_output(path):
    update_run_result_file("outputs", path)

def declare_input(path):
    update_run_result_file("inputs", path)
