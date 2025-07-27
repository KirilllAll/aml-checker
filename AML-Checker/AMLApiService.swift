//
//  AMLApiService.swift
//  AML-Checker
//
//  Created by Kirill Aksenov on 2025-07-12.
//
//  Сервис для работы с backend API (масштабируемый, для всех ручек)
//

import Foundation

/// Результат проверки адреса кошелька
struct WalletCheckResult: Decodable {
    let network: String
    let isValid: Bool
    let icon: String
    let title: String
}

/// Ошибки API
enum AMLApiError: Error {
    case network(String)
    case decoding
    case unknown
}

/// Сервис для работы с backend API
class AMLApiService {
    static let shared = AMLApiService()
    private init() {}
    
    /// Проверка адреса кошелька через backend
    func checkAddress(_ address: String, completion: @escaping (Result<WalletCheckResult, AMLApiError>) -> Void) {
        guard let url = URL(string: "http://localhost:3000/wallet/check") else {
            completion(.failure(.network("Bad URL")))
            return
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body = ["address": address]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    completion(.failure(.network(error.localizedDescription)))
                    return
                }
                guard let data = data else {
                    completion(.failure(.network("No data")))
                    return
                }
                if let result = try? JSONDecoder().decode(WalletCheckResult.self, from: data) {
                    completion(.success(result))
                } else {
                    completion(.failure(.decoding))
                }
            }
        }.resume()
    }
} 