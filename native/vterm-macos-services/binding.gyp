{
  "targets": [
    {
      "target_name": "vterm_macos_services",
      "sources": ["src/provider.mm"],
      "include_dirs": ["<!@(node -p \"require('node-addon-api').include\")"],
      "dependencies": ["<!(node -p \"require('node-addon-api').gyp\")"],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
      "conditions": [
        [
          "OS=='mac'",
          {
            "xcode_settings": {
              "MACOSX_DEPLOYMENT_TARGET": "10.15",
              "CLANG_CXX_LANGUAGE_STANDARD": "c++17",
              "CLANG_CXX_LIBRARY": "libc++",
              "OTHER_CFLAGS": ["-fobjc-arc", "-fvisibility=hidden"],
              "OTHER_CPLUSPLUSFLAGS": ["-fobjc-arc", "-fvisibility=hidden"]
            },
            "link_settings": {
              "libraries": ["-framework AppKit", "-framework Foundation"]
            }
          }
        ]
      ]
    }
  ]
}