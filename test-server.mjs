#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function testIconsServer() {
  console.log('🧪 Testing Icons MCP Server...\n');

  try {
    // Start the server process
    const serverProcess = spawn('node', ['dist/index.js'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'inherit']
    });

    // Create client and connect
    const transport = new StdioClientTransport({
      command: 'node',
      args: ['dist/index.js']
    });

    const client = new Client({
      name: 'icons-test-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });

    await client.connect(transport);

    // Test 1: List tools
    console.log('📋 Testing tool listing...');
    const tools = await client.listTools();
    console.log(`✅ Found ${tools.tools.length} tools:`, tools.tools.map(t => t.name).join(', '));

    // Test 2: Search icons
    console.log('\n🔍 Testing icon search...');
    const searchResult = await client.callTool({
      name: 'search_icons',
      arguments: { query: 'home', libraries: ['fontawesome'] }
    });
    console.log('✅ Search completed:', JSON.parse(searchResult.content[0].text).results.length, 'results');

    // Test 3: Get icon
    console.log('\n📦 Testing icon retrieval...');
    const iconResult = await client.callTool({
      name: 'get_icon',
      arguments: { name: 'home', library: 'fontawesome', format: 'svg' }
    });
    console.log('✅ Icon retrieved successfully');

    // Test 4: List categories
    console.log('\n📂 Testing category listing...');
    const categoriesResult = await client.callTool({
      name: 'list_categories',
      arguments: { library: 'fontawesome' }
    });
    console.log('✅ Categories listed successfully');

    await client.close();
    serverProcess.kill();

    console.log('\n🎉 All tests passed! Icons MCP Server is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testIconsServer().catch(console.error);
