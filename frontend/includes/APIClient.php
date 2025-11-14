<?php
class APIClient {
    
    private static $baseUrl = API_URL;
    
    /**
     * Make API request
     */
    private static function request($method, $endpoint, $data = null, $requiresAuth = false) {
        $url = self::$baseUrl . $endpoint;
        
        $ch = curl_init();
        
        $headers = [
            'Content-Type: application/json',
            'Accept: application/json'
        ];
        
        if ($requiresAuth) {
            $token = Session::getAccessToken();
            if ($token) {
                $headers[] = 'Authorization: Bearer ' . $token;
            }
        }
        
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if ($data) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        } elseif ($method === 'PUT') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
            if ($data) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        } elseif ($method === 'DELETE') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
        } elseif ($method === 'PATCH') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
            if ($data) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        curl_close($ch);
        
        if ($error) {
            return [
                'success' => false,
                'message' => 'Connection error: ' . $error
            ];
        }
        
        $result = json_decode($response, true);
        
        if ($result === null) {
            return [
                'success' => false,
                'message' => 'Invalid response from server'
            ];
        }
        
        // Handle token expiration
        if ($httpCode === 401 && $requiresAuth) {
            // Try to refresh token
            if (self::refreshToken()) {
                // Retry the request
                return self::request($method, $endpoint, $data, $requiresAuth);
            } else {
                // Redirect to login
                Session::destroy();
                header('Location: ?route=login');
                exit;
            }
        }
        
        return $result;
    }
    
    /**
     * Refresh access token
     */
    private static function refreshToken() {
        $refreshToken = Session::get('refresh_token');
        if (!$refreshToken) {
            return false;
        }
        
        $result = self::post('/auth/refresh', ['refreshToken' => $refreshToken], false);
        
        if ($result['success'] && isset($result['accessToken'])) {
            Session::updateAccessToken($result['accessToken']);
            return true;
        }
        
        return false;
    }
    
    /**
     * GET request
     */
    public static function get($endpoint, $requiresAuth = true) {
        return self::request('GET', $endpoint, null, $requiresAuth);
    }
    
    /**
     * POST request
     */
    public static function post($endpoint, $data, $requiresAuth = true) {
        return self::request('POST', $endpoint, $data, $requiresAuth);
    }
    
    /**
     * PUT request
     */
    public static function put($endpoint, $data, $requiresAuth = true) {
        return self::request('PUT', $endpoint, $data, $requiresAuth);
    }
    
    /**
     * PATCH request
     */
    public static function patch($endpoint, $data, $requiresAuth = true) {
        return self::request('PATCH', $endpoint, $data, $requiresAuth);
    }
    
    /**
     * DELETE request
     */
    public static function delete($endpoint, $requiresAuth = true) {
        return self::request('DELETE', $endpoint, null, $requiresAuth);
    }
}
