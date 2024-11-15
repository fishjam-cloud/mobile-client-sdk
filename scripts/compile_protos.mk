PROTOC_VERSION := 26.1
SWIFT_PROTOBUF_VERSION := 1.25.2

PROJECT_ROOT := $(shell git rev-parse --show-toplevel)

PROTOC_URL := https://github.com/protocolbuffers/protobuf/releases/download/v$(PROTOC_VERSION)/protoc-$(PROTOC_VERSION)-osx-universal_binary.zip
PROTOC_BASE_PATH := $(PROJECT_ROOT)/scripts/.protoc/$(PROTOC_VERSION)
PROTOC := $(PROTOC_BASE_PATH)/bin/protoc

SWIFT_PROTOBUF_BASE_PATH := $(PROJECT_ROOT)/scripts/.swift-protobuf/$(SWIFT_PROTOBUF_VERSION)
PROTOC_GEN_SWIFT := $(SWIFT_PROTOBUF_BASE_PATH)/bin/protoc-gen-swift

PROTOS_PATH := $(PROJECT_ROOT)/protos
PROTO_FILES := $(shell find $(PROTOS_PATH)/fishjam -name "*.proto")

ANDROID_OUT := $(PROJECT_ROOT)/packages/android-client/FishjamClient/src/main/java
IOS_OUT := $(PROJECT_ROOT)/packages/ios-client/Sources/FishjamClient/protos

# Compile in parallel
MAKEFLAGS += -j2

all: compile_android compile_ios
.PHONY: all

# Download protoc locally if needed
$(PROTOC):
	@if [ ! -f $(PROTOC) ]; then \
		echo "Downloading protoc $(PROTOC_VERSION)..."; \
		mkdir -p $(PROTOC_BASE_PATH); \
		curl -L $(PROTOC_URL) -o $(PROTOC_BASE_PATH)/protoc.zip; \
		unzip -o $(PROTOC_BASE_PATH)/protoc.zip -d $(PROTOC_BASE_PATH); \
		rm $(PROTOC_BASE_PATH)/protoc.zip; \
		echo "protoc $(PROTOC_VERSION) installed."; \
	else \
		echo "protoc $(PROTOC_VERSION) already installed."; \
	fi

# Download protoc_gen_swift locally if needed
$(PROTOC_GEN_SWIFT):
	@if [ ! -f $(PROTOC_GEN_SWIFT) ]; then \
		echo "Building swift-protobuf $(SWIFT_PROTOBUF_VERSION)..."; \
		mkdir -p $(SWIFT_PROTOBUF_BASE_PATH); \
		git clone https://github.com/apple/swift-protobuf.git $(SWIFT_PROTOBUF_BASE_PATH)/source; \
		cd $(SWIFT_PROTOBUF_BASE_PATH)/source && git checkout tags/$(SWIFT_PROTOBUF_VERSION); \
		cd $(SWIFT_PROTOBUF_BASE_PATH)/source && swift build -c release; \
		mkdir -p $(SWIFT_PROTOBUF_BASE_PATH)/bin; \
		cp $(SWIFT_PROTOBUF_BASE_PATH)/source/.build/release/protoc-gen-swift $(PROTOC_GEN_SWIFT); \
		rm -rf $(SWIFT_PROTOBUF_BASE_PATH)/source; \
		echo "swift-protobuf $(SWIFT_PROTOBUF_VERSION) installed."; \
	else \
		echo "swift-protobuf $(SWIFT_PROTOBUF_VERSION) already installed."; \
	fi

sync:
	@echo "Synchronising submodules..."
	@git submodule sync --recursive > /dev/null
	@git submodule update --recursive --remote --init > /dev/null
	@echo "DONE"

compile_android: $(PROTOC) sync
	@echo "Compiling proto files for Android"
	@for proto in $(PROTO_FILES); do \
		echo "Compiling Android: $$proto"; \
		$(PROTOC) -I=$(PROTOS_PATH) -I=$(PROTOC_BASE_PATH)/include --java_out=$(ANDROID_OUT) --kotlin_out=$(ANDROID_OUT) $$proto; \
	done
	@echo "DONE for Android"

compile_ios: $(PROTOC) $(PROTOC_GEN_SWIFT) sync
	@echo "Compiling proto files for iOS"
	@for proto in $(PROTO_FILES); do \
		echo "Compiling iOS: $$proto"; \
		$(PROTOC) -I=$(PROTOS_PATH) -I=$(PROTOC_BASE_PATH)/include --plugin=$(PROTOC_GEN_SWIFT) --swift_out=$(IOS_OUT) --swift_opt=Visibility=public $$proto; \
	done
	@echo "DONE for iOS"
	