import socket

ip_address = "172.168.101.4"
for port in range(1, 1025):  # Check ports 1 to 1024
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)
    result = sock.connect_ex((ip_address, port))
    if result == 0:
        print(f"Port {port} is open")
    sock.close()
