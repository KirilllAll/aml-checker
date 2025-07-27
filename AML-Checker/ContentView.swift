
import SwiftUI
// Добавить импорт сервиса


// MARK: - Перечисление для вариантов темы
enum AppColorScheme: String, CaseIterable, Identifiable {
    case system = "Системная"
    case light = "Светлая"
    case dark = "Тёмная"
    case autoByTime = "По времени"
    
    var id: String { self.rawValue }
    // MARK: - Иконка для каждой темы
    var icon: String {
        switch self {
        case .system: return "gearshape"
        case .light: return "sun.max"
        case .dark: return "moon"
        case .autoByTime: return "clock"
        }
    }
}

// MARK: - Перечисление для поддерживаемых сетей
enum WalletChain: String, CaseIterable, Identifiable {
    case ethereum = "Ethereum"
    case tron = "TRON"
    case ton = "TON"
    case bitcoin = "Bitcoin"
    case bsc = "Binance Smart Chain"
    case solana = "Solana"
    // Можно добавить другие сети
    
    var id: String { self.rawValue }
    var icon: String {
        switch self {
        case .ethereum: return "e.circle" // Можно заменить на кастомную иконку
        case .tron: return "t.circle"
        case .ton: return "t.square"
        case .bitcoin: return "bitcoinsign.circle"
        case .bsc: return "b.circle"
        case .solana: return "s.circle"
        }
    }
}

struct ContentView: View {
    // MARK: - Состояния для ввода адреса
    @State private var walletAddress: String = "" // Введённый адрес кошелька
    // MARK: - Определённая сеть (по адресу)
    @State private var detectedChain: WalletChain? = nil // Определённая сеть
    // MARK: - Состояния валидации
    @State private var isValidAddress: Bool = false // Валидность адреса
    // MARK: - Состояния для backend
    @State private var backendTitle: String = "AML Checker"
    @State private var backendIcon: String = "bolt.slash"
    @State private var backendNetwork: String? = nil
    @State private var isLoadingBackend: Bool = false
    @State private var backendError: String? = nil
    // MARK: - Состояние для выбранной темы
    @State private var selectedScheme: AppColorScheme = .system
    @State private var showThemeSheet: Bool = false
    @State private var selectedMockIndex: Int = 0 // Для автотеста
    @State private var showAMLSheet: Bool = false // Для показа модального окна AML
    @State private var debounceWorkItem: DispatchWorkItem? = nil // Для debounce
    @State private var lastCheckedAddress: String = "" // Последний валидный адрес

    // MARK: - Статус проверки адреса
    private enum Status {
        case idle, checking, success, error
    }

    private var status: Status {
        if isLoadingBackend {
            return .checking
        } else if walletAddress.isEmpty || walletAddress.count < 26 {
            return .idle
        } else if isValidAddress && backendNetwork != nil {
            return .success
        } else if backendError != nil {
            return .error
        } else {
            return .idle
        }
    }

    // MARK: - Вычисляемые свойства для иконки статуса
    private var iconName: String {
        switch status {
        case .idle: return "bolt.slash"
        case .checking: return "hourglass"
        case .success: return "bolt.fill"
        case .error: return "xmark.circle"
        }
    }
    private var iconColor: Color {
        switch status {
        case .idle: return .gray
        case .checking: return .yellow
        case .success: return .green
        case .error: return .red
        }
    }

    // MARK: - Функция для определения темы по времени
    private func colorSchemeForCurrentTime() -> ColorScheme? {
        let hour = Calendar.current.component(.hour, from: Date())
        // С 7 до 19 — светлая, иначе тёмная
        return (hour >= 7 && hour < 19) ? .light : .dark
    }

    // MARK: - Получение ColorScheme для передачи в preferredColorScheme
    private var preferredScheme: ColorScheme? {
        switch selectedScheme {
        case .system:
            return nil // Использовать системную
        case .light:
            return .light
        case .dark:
            return .dark
        case .autoByTime:
            return colorSchemeForCurrentTime()
        }
    }

    // MARK: - Функция отправки запроса на backend с debounce
    private func debounceCheckAddress(_ address: String) {
        debounceWorkItem?.cancel()
        let workItem = DispatchWorkItem { [address] in
            checkAddressBackend(address)
        }
        debounceWorkItem = workItem
        DispatchQueue.main.asyncAfter(deadline: .now() + 2, execute: workItem)
    }

    // MARK: - Функция отправки запроса на backend
    private func checkAddressBackend(_ address: String) {
        isLoadingBackend = true
        backendError = nil
        print("[checkAddressBackend] Отправка запроса на backend: \(address)")
        AMLApiService.shared.checkAddress(address) { result in
            self.isLoadingBackend = false
            switch result {
            case .success(let walletResult):
                print("[checkAddressBackend] SUCCESS: \(walletResult)")
                self.backendTitle = walletResult.title
                self.backendIcon = walletResult.icon
                self.backendNetwork = walletResult.network
                self.isValidAddress = walletResult.isValid
                self.detectedChain = WalletChain(rawValue: walletResult.title)
                if walletResult.isValid {
                    self.lastCheckedAddress = self.walletAddress
                    self.backendError = nil
                } else {
                    // Явно выставляем ошибку, если адрес невалиден
                    self.backendError = "Адрес кошелька невалиден"
                }
                // Если адрес валиден, сохраняем его как последний проверенный
                if walletResult.isValid {
                    self.lastCheckedAddress = self.walletAddress
                }
            case .failure(let error):
                print("[checkAddressBackend] FAILURE: \(error)")
                switch error {
                case .network(let message):
                    self.backendError = message
                case .decoding:
                    self.backendError = "Ошибка декодирования ответа"
                case .unknown:
                    self.backendError = "Неизвестная ошибка"
                }
                self.backendTitle = "AML Checker"
                self.backendIcon = "bolt.slash"
                self.isValidAddress = false
                self.detectedChain = nil
                self.backendNetwork = nil
                self.lastCheckedAddress = ""
            }
            print("[checkAddressBackend] После ответа: backendError=\(String(describing: self.backendError)), isValidAddress=\(self.isValidAddress), backendTitle=\(self.backendTitle)")
        }
    }

    // MARK: - Сброс состояния (полный)
    private func resetToInitialState() {
        backendTitle = "AML Checker"
        backendIcon = "bolt.slash"
        isValidAddress = false
        detectedChain = nil
        backendNetwork = nil
        lastCheckedAddress = ""
        backendError = nil
    }
    // MARK: - Сброс только валидации и ошибок (оставляет title/icon)
    private func resetValidationAndError() {
        isValidAddress = false
        detectedChain = nil
        backendNetwork = nil
        lastCheckedAddress = ""
        backendError = nil
    }

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            VStack(spacing: 32) {
                // MARK: - Контейнер с иконкой молнии, темой и текстом сети/заглушки
                HStack(spacing: 24) {
                    // Три состояния: дефолт, успех, ошибка
                    Image(systemName: iconName)
                        .foregroundColor(iconColor)
                        .font(.system(size: 32))
                        .accessibilityLabel("Статус соединения")
                    // В тайтле всегда AML Checker, если не определена сеть
                    Text((backendNetwork != nil && isValidAddress) ? backendTitle : "AML Checker")
                        .font(.appTitle)
                        .foregroundColor(.appPrimary)
                    // Кнопка выбора темы (вернули обратно)
                    Button(action: { showThemeSheet = true }) {
                        Image(systemName: selectedScheme == .dark ? "moon.fill" : (selectedScheme == .light ? "sun.max.fill" : "moon"))
                            .font(.system(size: 28))
                            .foregroundColor(.appSecondary)
                            .padding(8)
                    }
                    .accessibilityLabel("Выбрать тему оформления")
                }
                .frame(maxWidth: .infinity, alignment: .center)
                // MARK: - Поле ввода адреса с кнопкой очистки
                HStack {
                    TextField("Введите адрес кошелька", text: $walletAddress)
                        .padding()
                        .background(Color(.secondarySystemBackground))
                        .cornerRadius(12)
                        .font(.appBody)
                        .foregroundColor(.appPrimary)
                        .textContentType(.none)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                        .onChange(of: walletAddress) { newValue in
                            debounceWorkItem?.cancel()
                            if newValue.isEmpty || newValue.count < 26 {
                                resetToInitialState()
                                return
                            }
                            if isValidAddress && (newValue != lastCheckedAddress) {
                                resetValidationAndError()
                            } else {
                                backendError = nil
                            }
                            if newValue.count >= 26 {
                                debounceCheckAddress(newValue)
                            }
                        }
                    // Кнопка очистки
                    if !walletAddress.isEmpty {
                        Button(action: {
                            walletAddress = ""
                            resetToInitialState()
                        }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.gray)
                        }
                        .accessibilityLabel("Очистить поле ввода")
                    }
                }
                // MARK: - Кнопка проверки
                Button(action: {
                    // Перед открытием AMLInfoSheet ещё раз проверяем актуальность адреса
                    guard walletAddress == lastCheckedAddress, isValidAddress, backendNetwork != nil else { return }
                    showAMLSheet = true
                }) {
                    Text("Проверить")
                        .font(.appButton)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background((walletAddress == lastCheckedAddress && isValidAddress && backendNetwork != nil) ? Color.appAccent : Color.gray)
                        .cornerRadius(12)
                }
                .disabled(!(walletAddress == lastCheckedAddress && isValidAddress && backendNetwork != nil))
                // Подсказка о невалидности адреса
                if status == .error, let error = backendError, walletAddress.count >= 26 {
                    Text(error.isEmpty ? "Адрес кошелька невалиден" : error)
                        .foregroundColor(.red)
                        .font(.caption)
                }
                Spacer()
            }
            .padding(24)
            .sheet(isPresented: $showAMLSheet) {
                AMLInfoSheet(showSheet: $showAMLSheet)
            }
            .sheet(isPresented: $showThemeSheet) {
                // MARK: - Шторка с выбором темы через Toggle
                VStack(alignment: .leading, spacing: 20) {
                    Text("Тема оформления")
                        .font(.appTitle)
                        .padding(.top, 24)
                        .padding(.bottom, 8)
                    ForEach(AppColorScheme.allCases) { scheme in
                        HStack {
                            Image(systemName: scheme.icon)
                                .foregroundColor(.appSecondary)
                            Text(scheme.rawValue)
                                .font(.appBody)
                            Spacer()
                            Toggle("", isOn: Binding(
                                get: { selectedScheme == scheme },
                                set: { isOn in if isOn { selectedScheme = scheme } }
                            ))
                            .labelsHidden()
                        }
                        .padding(.vertical, 4)
                    }
                    Spacer()
                }
                .padding(.horizontal, 24)
                .presentationDetents([.medium, .large])
            }
        }
        .preferredColorScheme(preferredScheme)
    }
}

#Preview {
    ContentView()
}
