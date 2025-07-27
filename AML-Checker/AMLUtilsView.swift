//
//  AMLUtilsView.swift
//  AML-Checker
//
//  Created by Kirill Aksenov on 2025-07-12.
//
//  Здесь размещаются вспомогательные функции и утилиты для View-слоя приложения.
//  Можно импортировать и использовать в ContentView и других View.
//

import Foundation
import SwiftUI

// Пример: функция для форматирования адреса (сокращение)
func shortWalletAddress(_ address: String, prefix: Int = 6, suffix: Int = 4) -> String {
    guard address.count > prefix + suffix else { return address }
    let start = address.prefix(prefix)
    let end = address.suffix(suffix)
    return "\(start)...\(end)"
}

// Здесь можно добавлять другие утилиты для View 